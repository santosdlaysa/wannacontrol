export enum Plano {
  BASICO = 'BASICO',
  PROFISSIONAL = 'PROFISSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

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

export enum TipoPedido {
  MESA = 'MESA',
  DELIVERY = 'DELIVERY',
  RETIRADA = 'RETIRADA',
}

export enum StatusEntrega {
  RECEBIDO = 'RECEBIDO',
  CONFIRMADO = 'CONFIRMADO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  SAIU_ENTREGA = 'SAIU_ENTREGA',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
}

export const VALID_STATUS_TRANSITIONS: Record<StatusPreparo, StatusPreparo[]> = {
  [StatusPreparo.PENDENTE]: [StatusPreparo.PREPARANDO],
  [StatusPreparo.PREPARANDO]: [StatusPreparo.PRONTO],
  [StatusPreparo.PRONTO]: [StatusPreparo.ENTREGUE],
  [StatusPreparo.ENTREGUE]: [],
};
