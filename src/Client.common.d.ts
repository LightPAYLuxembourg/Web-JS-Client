export interface ClientsInterface {
    consumer_key: string;
    api_key: string;
    secret_key: string;
}

export interface DataInitInterface {
    merchant_id: string;
    amount: number;
    ref :string;
    custom_fields?: string; // foo=bar,bar=foo
}

export interface PaymentDetailsInterface {
    status: string
    amount: number
    formatted_amount: number
    transaction_id: string
    refunds: RefundsInterface[]
    payment_mode: string
    created_at: string
}

interface RefundsInterface {
    trx_id: string;
    amount: number;
    date: string;
}