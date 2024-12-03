// customers.routes.ts
import { Router, Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

// Interfaces
interface Address {
  street: string;
  number: string;
  complement?: string;
  zip_code: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  line_1?: string;
  line_2?: string;
}

interface Phone {
  country_code: string;
  area_code: string;
  number: string;
  type?: 'home' | 'mobile' | 'work';
}

interface CustomerRequest {
  name: string;
  email: string;
  code?: string;
  document: string;
  document_type?: 'CPF' | 'CNPJ' | 'PASSPORT';
  type?: 'individual' | 'company';
  gender?: 'male' | 'female';
  address?: Address;
  phones?: {
    home_phone?: Phone;
    mobile_phone?: Phone;
    work_phone?: Phone;
  };
  birthdate?: string;
  metadata?: Record<string, unknown>;
}

interface PagarMeResponse {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface ErrorResponse {
  error: string;
}

class CustomerError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'CustomerError';
  }
}

const validateCustomerData = (data: CustomerRequest): void => {
  if (!data.name?.trim()) {
    throw new CustomerError(400, 'Nome é obrigatório');
  }

  if (!data.email?.trim()) {
    throw new CustomerError(400, 'Email é obrigatório');
  }

  if (!data.document?.trim()) {
    throw new CustomerError(400, 'Documento é obrigatório');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new CustomerError(400, 'Formato de email inválido');
  }
};

// Criando o router
const customerRouter = Router();

// Definindo a rota POST
customerRouter.post(
  '/customers',
  async (
    req: any,
    res: any
  ) => {
    try {
      const customerData = req.body;

      // Validar dados
      validateCustomerData(customerData);

      // Configuração do cliente Pagar.me
      const pagarmeConfig = {
        baseURL: 'https://api.pagar.me/core/v5',
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.PAGARME_API_KEY || '').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      };

      // Valores default
      const enrichedCustomerData: CustomerRequest = {
        ...customerData,
        document_type: customerData.document_type || 'CPF',
        type: customerData.type || 'individual'
      };

      // Fazer requisição para a API da Pagar.me
      const response = await axios.post<PagarMeResponse>(
        '/customers',
        enrichedCustomerData,
        pagarmeConfig
      );

      return res.status(201).json(response.data);

    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);

      if (error instanceof CustomerError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        return res.status(axiosError.response?.status || 500).json({
          error: axiosError.response?.data?.message || 'Erro ao processar requisição na Pagar.me'
        });
      }

      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default customerRouter;