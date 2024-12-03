export interface BankAccount {
  legalName: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  bankCode: string;
  agencia: string;
  conta: string;
  contaDv: string;
}

export interface HomeownerFormData {
  name: string;
  email: string;
  document: string;
  phone: string;
  bankAccount: BankAccount;
}

export interface HomeownerResponse {
  id: string;
  status: string;
  type: string;
}
