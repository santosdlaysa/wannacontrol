import { StatusMesa, StatusPreparo } from './enums';

export const SOCKET_EVENTS = {
  // Server -> Client
  ITEM_STATUS_CHANGED: 'item:statusChanged',
  ITEM_READY: 'item:ready',
  MESA_STATUS_CHANGED: 'mesa:statusChanged',
  NEW_ORDER_ITEMS: 'order:newItems',
  ORDER_CLOSED: 'order:closed',
  NEW_DELIVERY_ORDER: 'order:newDelivery',

  // Client -> Server (room management)
  JOIN_KITCHEN: 'room:joinKitchen',
  JOIN_WAITER: 'room:joinWaiter',
  LEAVE_KITCHEN: 'room:leaveKitchen',
  LEAVE_WAITER: 'room:leaveWaiter',
} as const;

export interface ItemStatusChangedPayload {
  itemId: number;
  pedidoId: number;
  mesaNumero: number;
  produtoNome: string;
  novoStatus: StatusPreparo;
}

export interface ItemReadyPayload {
  itemId: number;
  pedidoId: number;
  mesaNumero: number;
  produtoNome: string;
  garcomId: number;
}

export interface MesaStatusChangedPayload {
  mesaId: number;
  mesaNumero: number;
  novoStatus: StatusMesa;
}

export interface NewOrderItemsPayload {
  pedidoId: number;
  mesaNumero: number;
  itens: Array<{
    id: number;
    produtoNome: string;
    quantidade: number;
    observacao: string | null;
  }>;
}

export interface OrderClosedPayload {
  pedidoId: number;
  mesaId: number;
  mesaNumero: number;
}

export interface NewDeliveryOrderPayload {
  pedidoId: number;
  clienteNome: string;
  clienteTelefone: string;
  tipoPedido: 'DELIVERY' | 'RETIRADA';
  total: number;
  itensCount: number;
  restauranteId: number;
}
