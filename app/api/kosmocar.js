(function (global) {
    // Base endpoints per brand
    const baseUrls = {
        VW: "https://myservicenow-vw.kosmocar.gr/api/Vehicle/",
        AU: "https://myservicenow-audi.kosmocar.gr/api/Vehicle/",
        SK: "https://myservicenow-skoda.kosmocar.gr/api/Vehicle/"
    };

    // User-facing labels for status messages
    const labels = global.Utils.BRAND_LABELS;

    // Normalize a Kosmocar vehicle payload into UI-friendly fields
    const extractVehicleInfo = (data) => {
        if (!data || !data.listOfData || !data.listOfData.length) return null;
        const raw = data.listOfData[0];
        return {
            make: raw.u_IDMS_Make || 'Unknown',
            model: raw.u_IDMS_Model?.replace(/"/g, '') || 'Unknown',
            prod_year: raw.u_IDMS_ProdYear || 'Unknown',
            vin: raw.u_IDMS_VIN || 'Unknown',
            licensing_date: raw.licensingDate?.slice(0, 10) || 'Unknown',
            license_no: raw.u_IDMS_LicenseNo || 'Unknown',
            hasVehicleProfile: true
        };
    };

    const fetchVehicleWithEndpoint = async (url, endpoint) => {
        const response = await fetch(`${url}${endpoint}`);
        const data = await response.json();
        return data && data.listOfData && data.listOfData.length > 0 ? extractVehicleInfo(data) : null;
    };

    // Fetch by VIN
    const fetchVehicleByVin = async (vin, brandCode, onAttempt) => {
        if (!brandCode || !baseUrls[brandCode]) return null;
        const label = labels[brandCode] || brandCode;
        if (typeof onAttempt === 'function') onAttempt(label);
        return fetchVehicleWithEndpoint(baseUrls[brandCode], `GetVehicleWithVin/${vin}`);
    };

    // Fetch by plate
    const fetchVehicleByPlate = async (plate, onAttempt) => {
        // Try all brands until one hits
        for (const [brand, url] of Object.entries(baseUrls)) {
            const label = labels[brand] || brand;
            if (typeof onAttempt === 'function') onAttempt(label);
            const data = await fetchVehicleWithEndpoint(url, `GetVehicleWithLicenseNo/${plate}`);
            if (data) return data;
        }
        return null;
    };

    // Fetch Kosmocar recalls and normalize list
    const fetchKosmocarRecalls = async (vin) => {
        const kosmocarUrl = `https://campaigns-recalls.kosmocar.gr/wp-json/ajax/vin/?vin=${vin}`;
        let responded = false;
        let recalls = [];
        try {
            const response = await fetch(kosmocarUrl);
            if (response.ok) {
                const data = await response.json();
                if (data?.body && typeof data.body === 'string') {
                    const parsedBody = JSON.parse(data.body);
                    recalls = parsedBody.serviceCampaigns?.serviceCampaign?.map(campaign => ({
                        id: campaign.serviceCampaignIdentifier?.serviceCampaignUID?.value || 'Unknown',
                        details: `${campaign.campaignDescription?.value || 'No description'}`,
                        startDate: `${campaign.startDate || 'Unknown'}`,
                        fixed: false
                    })) || [];
                }
                responded = true;
            }
        } catch {}
        return { responded, recalls };
    };

    // Expose API functions
    global.KosmocarApi = {
        fetchVehicleByVin,
        fetchVehicleByPlate,
        fetchKosmocarRecalls
    };
})(window);
