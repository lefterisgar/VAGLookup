(function (global) {
    const proxyOrigin = "https://go.x2u.in/proxy?email=ds23175@go.uop.gr&apiKey=8a650520&url=";
    const apiUrl = "https://api-gw.oneplatform-prod.oneapi.volkswagen.com/vlt/vinLookUp";

    const fetchJson = async (url, options) => {
        const response = await fetch(url, options);
        if (!response?.ok) return { ok: false, data: null };
        const data = await response.json();
        return { ok: true, data };
    };

    const normalizeRecalls = (payload, campaignType) => {
        if (!Array.isArray(payload)) return [];
        let records = payload;
        if (campaignType === 'airbag') {
            const today = new Date();
            records = records.filter(recall => {
                const startDate = recall.startDate ? new Date(recall.startDate) : today;
                return startDate <= today;
            });
        }
        return records.map(recall => ({
            id: recall.campaignUID || 'Unknown',
            details: `${recall.criterion || 'No description'}`,
            campaignType,
            startDate: recall.startDate,
            repairDate: recall.repairDate
        }));
    };

    const buildRequest = (campaignType, vin) => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignType, country: 'GR', vin })
    });

    const fetchCampaign = async (vin, type) => {
        const { ok, data } = await fetchJson(proxyOrigin + apiUrl, buildRequest(type, vin));
        if (!ok || !data?.payload) return { ok: false, records: [] };
        return { ok: true, records: normalizeRecalls(data.payload, type) };
    };

    const fetchVWGlobalRecalls = async (vin) => {
        let vwRecalls = [];
        let responded = false;
        let dieselFound = false;

        const dieselResult = await fetchCampaign(vin, 'diesel');
        if (dieselResult.ok) {
            responded = true;
            if (dieselResult.records.length > 0) {
                vwRecalls = vwRecalls.concat(dieselResult.records);
                dieselFound = true;
            }
        }

        const airbagResult = await fetchCampaign(vin, 'airbag');
        if (airbagResult.ok) {
            responded = true;
            if (airbagResult.records.length > 0) {
                vwRecalls = vwRecalls.concat(airbagResult.records);
            }
        }

        if (!dieselFound) {
            const cngResult = await fetchCampaign(vin, 'cng');
            if (cngResult.ok) {
                responded = true;
                if (cngResult.records.length > 0) {
                    vwRecalls = vwRecalls.concat(cngResult.records);
                }
            }
        }

        return { data: vwRecalls, responded };
    };

    global.VWGlobalApi = {
        fetchVWGlobalRecalls
    };
})(window);
