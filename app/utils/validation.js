(function (global) {
    const regPattern = /^[ABEHIKMNOPRTXYZ]{3}[0-9]{4}$/;
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;

    const brandCodes = {
        VW: ["WVW","WVG","WV1","WV2","AAM","PPV","XW8","1V1","1V2","1VW","2V4","2V8","3VV","3VW","8AW","9BW"],
        AU: ["WAU","WUA","WAC","WU1","AAA","TRU","93U","99A"],
        SK: ["TMB","TMP","Y6U","MEX"]
    };

    const detectBrandFromVIN = (vin) => {
        return Object.entries(brandCodes)
            .find(([_, codes]) => codes.some(code => vin.startsWith(code)))?.[0] || null;
    };

    const verifyVinCheckDigit = (vin) => {
        const transliteration = {
            A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
            J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
            S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
            0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9
        };
        const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < vin.length; i++) {
            const char = vin[i];
            const value = transliteration[char];
            if (value === undefined) return false;
            sum += value * weights[i];
        }
        const remainder = sum % 11;
        const expectedDigit = remainder === 10 ? 'X' : remainder.toString();
        return vin[8] === expectedDigit;
    };

    const isValidVin = (vin) => {
        if (!vinPattern.test(vin)) return false;
        // EU-market VAG VINs often use 'Z' as checksum placeholder.
        return vin[8] === 'Z' ? true : verifyVinCheckDigit(vin);
    };

    const determineInputType = (input) => {
        if (regPattern.test(input)) {
            return { kind: 'REG' };
        }
        if (input.length === 17 && isValidVin(input)) {
            const brand = detectBrandFromVIN(input);
            if (brand) return { kind: 'VIN', brand };
        }
        return null;
    };

    global.ValidationApi = {
        determineInputType,
        detectBrandFromVIN,
        isValidVin
    };
})(window);
