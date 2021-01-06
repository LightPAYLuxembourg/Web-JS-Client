export const currencyFormatter = (value: any) => {
    try
    {
        let price;
        if(typeof value == "string")
            price = value.replace(/\D/g, '');
        else {
            price = value;
        }
        const formatter = new Intl.NumberFormat('fr-Fr', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            // the default value for minimumFractionDigits depends on the currency
            // and is usually already 2
        });
        return formatter.format(parseInt(price) / 100);
    }
    catch(e) {
        console.log("[Filters.ts] : CurrencyFormatter error : " + e);
    }
};

export const formatRequestPrice = (price: any): number =>
{
    if(!price)
        return;

    try
    {
        let priceFloat = parseFloat(price.replace(",", "."));
        const formatter = new Intl.NumberFormat('fr-Fr', {
            style: 'decimal',
            minimumIntegerDigits: 1,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
            // the default value for minimumFractionDigits depends on the currency
            // and is usually already 2
        });
        //console.log(formatter.format(priceFloat).replace(/\D/g, ''));
        return parseInt(formatter.format(priceFloat).replace(/\D/g, ''));
    }
    catch(e) {
        console.log(`[Functions.ts] : formatteRequestPrice error ${e}`)
    }
}

