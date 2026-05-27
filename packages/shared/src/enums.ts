export enum Perfil {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  CAIXA = 'CAIXA',
  GARCOM = 'GARCOM',
  COZINHA = 'COZINHA',
}

export enum StatusMesa {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  AGUARDANDO_CONTA = 'AGUARDANDO_CONTA',
}

export enum StatusPedido {
  ABERTO = 'ABERTO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
}

export enum StatusPreparo {
  PENDENTE = 'PENDENTE',
  PREPARANDO = 'PREPARANDO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
}

export const VALID_STATUS_TRANSITIONS: Record<StatusPreparo, StatusPreparo[]> = {
  [StatusPreparo.PENDENTE]: [StatusPreparo.PREPARANDO],
  [StatusPreparo.PREPARANDO]: [StatusPreparo.PRONTO],
  [StatusPreparo.PRONTO]: [StatusPreparo.ENTREGUE],
  [StatusPreparo.ENTREGUE]: [],
};
