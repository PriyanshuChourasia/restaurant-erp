import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus, OrderType, FulfillmentMethod } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PriceLevelsService } from '../../price-levels/services/price-levels.service';
import { CustomersService } from '../../customers/services/customers.service';
import { TablesService } from '../../seating/services/tables.service';
import { ReservationsService } from '../../reservations/services/reservations.service';
import { KotService } from '../../kot/services/kot.service';
import { KotStation, KotStatus } from '../../kot/entities/kot.entity';
import { SalesService } from '../../sales/services/sales.service';
import { PaymentMethod } from '../../sales/entities/sales.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly priceLevelsService: PriceLevelsService,
    private readonly customersService: CustomersService,
    private readonly tablesService: TablesService,
    private readonly reservationsService: ReservationsService,
    private readonly kotService: KotService,
    private readonly salesService: SalesService,
  ) {}

  async findAll(page = 1, limit = 20, status?: string, orderType?: string) {
    const query = this.repo.createQueryBuilder('o').leftJoinAndSelect('o.items', 'items');
    if (status) query.andWhere('o.status = :status', { status });
    if (orderType) query.andWhere('o.orderType = :orderType', { orderType });
    query.orderBy('o.createdAt', 'DESC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    const withFlags = await Promise.all(data.map(async (o) => ({
      ...o,
      unavailableItems: await this.getUnavailableItems(o.id),
    })));
    return { data: withFlags, total, page, limit };
  }

  /** Items the kitchen has flagged as unavailable on any KOT linked to this order — advisory
   * only, surfaced to staff so they can swap/drop the item themselves before charging. */
  private async getUnavailableItems(orderId: string) {
    const kots = await this.kotService.findByOrderId(orderId);
    return kots.flatMap((kot) =>
      kot.items
        .filter((item) => item.isUnavailable)
        .map((item) => ({ itemName: item.itemName, note: item.unavailableNote })),
    );
  }

  async findByIdWithFlags(id: string) {
    const order = await this.findById(id);
    return { ...order, unavailableItems: await this.getUnavailableItems(id) };
  }

  async findById(id: string) {
    const order = await this.repo.findOne({ where: { id }, relations: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto) {
    if ((dto.orderType === OrderType.PARTY || dto.orderType === OrderType.SCHEDULED) && !dto.scheduledFor) {
      throw new BadRequestException(`${dto.orderType} orders require a scheduledFor date/time`);
    }

    let effectiveCustomerName = dto.customerName || null;
    let effectiveCustomerPhone = dto.customerPhone || null;
    let effectiveCustomerGstin = dto.customerGstin || null;
    if (dto.customerId) {
      const customer = await this.customersService.findOne(dto.customerId);
      effectiveCustomerName = effectiveCustomerName || customer.name;
      effectiveCustomerPhone = effectiveCustomerPhone || customer.phone;
      effectiveCustomerGstin = effectiveCustomerGstin || customer.gstin;
    }

    const { itemEntities, subtotal, cgstTotal, sgstTotal, taxTotal } =
      await this.priceLevelsService.resolveLineItems(dto.items, dto.customerId);

    const discountPercent = dto.discountPercent || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const grandTotal = Math.round((subtotal + taxTotal - discountAmount) * 100) / 100;

    const count = await this.repo.count();
    const order = this.repo.create({
      orderNumber: `ORD-${String(count + 1).padStart(6, '0')}`,
      orderType: dto.orderType,
      fulfillmentMethod: dto.fulfillmentMethod || FulfillmentMethod.DINE_IN,
      status: OrderStatus.PENDING_CONFIRMATION,
      customerId: dto.customerId || null,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      customerGstin: effectiveCustomerGstin,
      tableIds: dto.tableIds && dto.tableIds.length > 0 ? dto.tableIds : null,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
      partySize: dto.partySize || null,
      discountPercent: dto.discountPercent || null,
      subtotal,
      cgstTotal,
      sgstTotal,
      taxTotal,
      grandTotal,
      notes: dto.notes || null,
      items: itemEntities as OrderItem[],
    });
    const saved = await this.repo.save(order);

    if (dto.tableIds && dto.tableIds.length > 0) {
      if (dto.orderType === OrderType.REGULAR) {
        // Immediate walk-in: occupy the table now, same as the old direct-invoice flow
        await this.tablesService.bulkUpdateStatus(dto.tableIds, 'occupied');
      } else if (dto.scheduledFor) {
        // Party/Scheduled dine-in: hold the table for that time window via a Reservation
        // rather than occupying it now (Reservation only supports a single table).
        const reservation = await this.reservationsService.create({
          customerName: effectiveCustomerName || 'Guest',
          customerPhone: effectiveCustomerPhone || undefined,
          partySize: dto.partySize || 1,
          tableId: dto.tableIds[0],
          scheduledFor: dto.scheduledFor,
          durationMinutes: 120,
          source: 'walk_in',
          status: 'confirmed',
          notes: `Auto-created for order ${saved.orderNumber}`,
        });
        saved.reservationId = reservation.id;
        await this.repo.save(saved);
      }
    }

    return saved;
  }

  async confirm(id: string) {
    const order = await this.findById(id);
    if (order.status !== OrderStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException(`Cannot confirm an order with status "${order.status}"`);
    }
    await this.repo.update(id, { status: OrderStatus.CONFIRMED });

    // Regular orders fire the KOT the instant they're confirmed — matches the old
    // one-step Charge flow's instant feel. Party/Scheduled wait for an explicit
    // "Send to Kitchen" action closer to prep time.
    if (order.orderType === OrderType.REGULAR) {
      return this.sendToKitchen(id);
    }
    return this.findById(id);
  }

  async sendToKitchen(id: string, station: KotStation = KotStation.MAIN_KITCHEN) {
    const order = await this.findById(id);
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order must be confirmed before it can be sent to the kitchen');
    }
    if (order.kotSent) {
      throw new BadRequestException('This order has already been sent to the kitchen');
    }

    if (order.items.length > 0) {
      await this.kotService.create({
        orderId: order.id,
        tableIds: order.tableIds || undefined,
        station,
        items: order.items.map((i) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          quantity: Number(i.quantity),
        })),
      });
    }

    await this.repo.update(id, { kotSent: true });
    return this.findById(id);
  }

  /**
   * Edits the items on an order any time before it's charged — covers both "cancel a
   * product before it's sent to kitchen" and "swap an item after the kitchen flagged it
   * unavailable" (even once already sent). If the order was already sent to the kitchen,
   * a supplementary KOT is fired for the revised list rather than trying to edit/diff the
   * original ticket, which is treated as an immutable historical record.
   */
  async updateItems(id: string, items: Array<{ itemId: string; quantity: number }>) {
    const order = await this.findById(id);
    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException(`Cannot edit items on an order with status "${order.status}"`);
    }
    if (items.length === 0) {
      throw new BadRequestException('An order must have at least one item');
    }

    const { itemEntities, subtotal, cgstTotal, sgstTotal, taxTotal } =
      await this.priceLevelsService.resolveLineItems(items, order.customerId || undefined);

    const discountPercent = order.discountPercent ? Number(order.discountPercent) : 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const grandTotal = Math.round((subtotal + taxTotal - discountAmount) * 100) / 100;

    const wasAlreadySent = order.kotSent;

    await this.orderItemRepo.delete({ orderId: id });
    order.items = itemEntities as OrderItem[];
    order.subtotal = subtotal;
    order.cgstTotal = cgstTotal;
    order.sgstTotal = sgstTotal;
    order.taxTotal = taxTotal;
    order.grandTotal = grandTotal;
    await this.repo.save(order);

    if (wasAlreadySent) {
      await this.kotService.create({
        orderId: order.id,
        tableIds: order.tableIds || undefined,
        station: KotStation.MAIN_KITCHEN,
        notes: 'Revised order — please reconcile with the original ticket',
        items: itemEntities.map((i) => ({ itemId: i.itemId, itemName: i.itemName, quantity: i.quantity })),
      });
    }

    return this.findById(id);
  }

  async charge(id: string, paymentMethod: PaymentMethod) {
    const order = await this.findById(id);
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot charge an order with status "${order.status}"`);
    }

    const discountAmount = order.discountPercent
      ? Math.round(((Number(order.subtotal) * Number(order.discountPercent)) / 100) * 100) / 100
      : 0;

    const invoice = await this.salesService.create({
      customerId: order.customerId || undefined,
      customerName: order.customerName || undefined,
      customerPhone: order.customerPhone || undefined,
      customerGstin: order.customerGstin || undefined,
      tableIds: order.tableIds || undefined,
      paymentMethod,
      discount: discountAmount,
      notes: order.notes || undefined,
      orderId: order.id,
      items: order.items.map((i) => ({ itemId: i.itemId, quantity: Number(i.quantity) })),
    });

    await this.repo.update(id, { status: OrderStatus.BILLED, invoiceId: invoice.id });
    return { order: await this.findById(id), invoice };
  }

  async cancel(id: string) {
    const order = await this.findById(id);
    if (order.status === OrderStatus.BILLED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel an order with status "${order.status}"`);
    }

    if (order.kotSent) {
      const kots = await this.kotService.findByOrderId(order.id);
      for (const kot of kots) {
        await this.kotService.updateStatus(kot.id, KotStatus.CANCELLED);
      }
    }

    if (order.tableIds && order.tableIds.length > 0 && order.orderType === OrderType.REGULAR) {
      await this.tablesService.bulkUpdateStatus(order.tableIds, 'available');
    }

    if (order.reservationId) {
      await this.reservationsService.updateStatus(order.reservationId, 'cancelled');
    }

    await this.repo.update(id, { status: OrderStatus.CANCELLED });
    return this.findById(id);
  }
}
