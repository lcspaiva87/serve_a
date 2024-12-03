import axios from 'axios';
import express from 'express';

const router = express.Router();

const api = axios.create({
  baseURL: 'https://api.pagar.me/core/v5',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${Buffer.from(process.env.PAGARME_API_KEY + ':').toString('base64')}`,
  },
});

// Endpoint para criar um proprietário
router.post('/homeowners', async (req:any, res:any) => {
  try {
    const data = req.body;

    if (!data.default_bank_account) {
      return res.status(400).json({ message: 'Bank account information is required.' });
    }

    const response = await api.post('/customers', {
      name: data.name,
      email: data.email,
      description: 'Homeowner account',
      document: data.document,
      type: data.default_bank_account.holder_type === 'cpf' ? 'individual' : 'company',
      default_bank_account: {
        holder_name: data.default_bank_account.holder_name,
        document_type: data.default_bank_account.holder_type === 'cpf' ? 'individual' : 'company',
        holder_document: data.default_bank_account.holder_document,
        bank: data.default_bank_account.bank,
        branch_number: data.default_bank_account.branch_number,
        account_number: data.default_bank_account.account_number,
        account_check_digit: data.default_bank_account.account_check_digit,
        type: 'checking',
      },
      metadata: {
        phone: data.metadata.phone,
      },
      automatic_anticipation_settings: {
        enabled: true,
        type: 'full',
        volume_percentage: 100,
        delay: 0,
      },
      transfer_settings: {
        transfer_enabled: true,
        transfer_interval: 'daily',
        transfer_day: 0,
      },
      code: data.document,
      payment_mode: 'bank_transfer',
    });

    // Enviar resposta para o frontend
    res.status(200).json({
      id: response.data.id,
      status: response.data.status,
      type: response.data.type,
    });
  } catch (error: any) {
    // Tratar erros da API da Pagar.me
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message,
        code: error.response.data.code,
        details: error.response.data,
      });
    }
    console.log(error);
    // Tratar erros gerais
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

export default router;