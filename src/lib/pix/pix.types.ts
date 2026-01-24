/**
 * PIX Props interface
 */
export interface PIXProps {
    /**
     * Chave PIX
     *
     * *** Formatos validos ***
     * EMAIL: fulano_da_silva.recebedor@example.com
     * CPF: 12345678900
     * CNPJ: 00038166000105
     * TELEFONE: +5561912345678
     * ALEATORIA: 123e4567-e12b-12d1-a456-426655440000
     */
    pixkey: string;

    /**
     * Nome de quem recebe o PIX
     */
    merchant: string;

    /**
     * Cidade de quem recebe o PIX
     */
    city: string;

    /**
     * CEP de quem recebe o PIX
     * (optional)
     */
    cep?: string | null;

    /**
     * Codigo para identificacao posterior do PIX
     */
    code?: string;

    /**
     * Valor do PIX
     * (opcional)
     */
    amount?: number | null;

    /**
     * Verifica ou nao erros nas informacoes fornecidas
     */
    ignoreErrors?: boolean;
}