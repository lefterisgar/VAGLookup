(function (global) {
    const BRAND_LABELS = { VW: "VW", AU: "Audi", SK: "Skoda" };

    const copyField = async (ctx, value, field) => {
        if (!value || !navigator?.clipboard) return;
        try {
            await navigator.clipboard.writeText(value);
            ctx.copiedField = field;
            setTimeout(() => (ctx.copiedField = ''), 3000);
        } catch {}
    };

    const pickRandomTagline = (ctx) => {
        if (Array.isArray(ctx.taglines) && ctx.taglines.length > 0) {
            ctx.taglineIndex = Math.floor(Math.random() * ctx.taglines.length);
        }
    };

    const buildFallbackVehicle = (identifier, brandCode) => {
        const label = brandCode ? BRAND_LABELS[brandCode] || brandCode : 'Unknown';
        return {
            make: label,
            model: 'Unknown',
            prod_year: 'Unknown',
            vin: identifier,
            licensing_date: 'Unknown',
            license_no: 'Unknown',
            hasVehicleProfile: false
        };
    };

    global.Utils = {
        BRAND_LABELS,
        copyField,
        pickRandomTagline,
        buildFallbackVehicle
    };
})(window);
