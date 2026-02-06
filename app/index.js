function vagLookup() {
    return {
        query: '',
        loading: false,
        result: null,
        message: '',
        taglines: [
            "Built by an enthusiast. Powered by truth.",
            "Built for the cars we wrench on every day.",
            "Real recalls. Real service data. Real answers.",
            "The Greek way to decode the VAG universe.",
            "This isn't CarVertical. It's better.",
            "Underground automotive data — now above ground.",
            "We show you what the dealers don't."
        ],
        taglineIndex: 0,
        vehiclePlaceholder: "Run a lookup to view vehicle details.",
        recallPlaceholder: "Run a lookup to view recall history.",
        vehicleMessageLoading: false,
        recallMessageLoading: false,
        showVehicleContent: false,
        showRecallContent: false,
        showKosmocarResults: false,
        recallStatusNote: '',
        recallPlaceholderVisible: true,
        copiedField: '',
        superEtka: {
            found: false,
            checked: false,
            prHtml: '',
            codingHtml: ''
        },
        superEtkaPlaceholder: "Run a lookup — SuperETKA dossier will display here.",
        superEtkaMessageLoading: false,
        superEtkaQueueApi: 'https://script.google.com/macros/s/AKfycbznQY-KLNYrC_Q1fHK-Jv3qPIamyzSJvlto8hPjlGRv-RKXi54qGAmzG207kAld97kW/exec',
        superEtkaQueueTimer: null,
        superEtkaRevealReady: false,
        superEtkaQueue: {
            position: '0/0',
            decodedCount: 0,
            status: '',
            loading: false,
            error: '',
            comment: '',
            enqueued: false
        },
        superEtkaHtmlLoading: '',
        showHelp: false,

        init() {
            this.pickRandomTagline();
            this.fetchSuperEtkaDecodedStats();
        },

        // ------- UI helpers -------
        scrollToSection(refName = 'resultsPanel') {
            return window.UiHelpers.scrollToSection(this, refName);
        },

        setVehicleStatus(text, loading) {
            return window.StateHelpers.setVehicleStatus(this, text, loading);
        },

        setRecallStatus(text, loading) {
            return window.StateHelpers.setRecallStatus(this, text, loading);
        },

        setSuperEtkaStatus(text, loading) {
            return window.StateHelpers.setSuperEtkaStatus(this, text, loading);
        },

        revealRecallsContent() {
            return window.UiHelpers.revealRecallsContent(this);
        },

        revealKosmocarResults(hasRecalls) {
            return window.UiHelpers.revealKosmocarResults(this, hasRecalls);
        },

        async openSuperEtkaHtml(type) {
            return window.SuperEtkaViewer.openHtml.call(this, type);
        },
        async handleSuperEtkaLookup(vin) {
            if (!vin) {
                this.setSuperEtkaStatus("Awaiting vehicle lookup…", true);
                return;
            }
            this.setSuperEtkaStatus("Checking SuperETKA queue status…", true);
            await this.fetchSuperEtkaQueueStatus(vin, { indicateChecking: true });
            this.superEtka.checked = true;
            if (this.superEtkaQueue.status === 'done') {
                this.superEtka.found = true;
                const links = window.SuperEtkaApi.buildHtmlLinks(vin);
                this.superEtka.prHtml = links.prHtml;
                this.superEtka.codingHtml = links.codingHtml;
                this.setSuperEtkaStatus("", false);
                this.superEtkaRevealReady = false;
                this.$nextTick?.(() => requestAnimationFrame(() => (this.superEtkaRevealReady = true)));
            } else {
                this.superEtka.found = false;
                this.superEtkaRevealReady = false;
                if (!this.superEtkaQueue.status || this.superEtkaQueue.status === '') {
                    this.setSuperEtkaStatus("No SuperETKA dossier yet. Add it to the queue below.", false);
                } else {
                    this.setSuperEtkaStatus("", false);
                }
            }
        },

        startSuperEtkaQueuePolling(vin) {
            if (!vin) return;
            this.stopSuperEtkaQueuePolling();
            this.superEtkaQueueTimer = setInterval(() => {
                this.fetchSuperEtkaQueueStatus(vin);
            }, 15000);
        },

        stopSuperEtkaQueuePolling() {
            if (this.superEtkaQueueTimer) {
                clearInterval(this.superEtkaQueueTimer);
                this.superEtkaQueueTimer = null;
            }
        },

        resetLookupState() {
            return window.StateHelpers.resetLookupState(this);
        },

        showLookupError(message) {
            return window.StateHelpers.showLookupError(this, message);
        },

        async copyField(value, field) {
            return window.Utils.copyField(this, value, field);
        },

        async fetchData() {
            this.resetLookupState();
            const sanitizedInput = this.query.trim().replace(/\s+/g, '').replace('-', '').toUpperCase();
            const inputMeta = window.ValidationApi.determineInputType(sanitizedInput);

            if (!inputMeta) {
                this.showLookupError("Enter a valid VAG VIN or Greek registration plate (e.g. ABC1234).");
                return;
            }

            const vehicleData = await this.fetchVehicleInfo(sanitizedInput, inputMeta);
            if (!vehicleData) {
                if (inputMeta.kind === 'REG') {
                    this.showLookupError("This registration plate was not found in Kosmocar records.");
                    return;
                }
                this.result = window.Utils.buildFallbackVehicle(sanitizedInput, inputMeta.brand || null);
            } else {
                this.result = vehicleData;
            }

            this.setVehicleStatus("", false);
            this.setRecallStatus("Preparing recall lookup…", true);
            this.setSuperEtkaStatus("Checking SuperETKA archives…", true);
            this.showVehicleContent = true;
            this.scrollToSection('vehiclePanel');

            await Promise.all([
                this.fetchRecalls(this.result.vin, this.result.make),
                this.handleSuperEtkaLookup(this.result.vin)
            ]);
            this.loading = false;
        },

        async fetchVehicleInfo(inputStr, inputMeta) {
            const requestVehicle = (label) => this.setVehicleStatus(`Searching ${label} records…`, true);
            if (inputMeta.kind === 'REG') {
                const sanitizedPlate = inputStr.replace('R', 'P');
                const data = await window.KosmocarApi.fetchVehicleByPlate(sanitizedPlate, requestVehicle);
                if (data) {
                    this.setVehicleStatus("", false);
                    return data;
                }
            } else if (inputMeta.kind === 'VIN') {
                const data = await window.KosmocarApi.fetchVehicleByVin(inputStr, inputMeta.brand, requestVehicle);
                if (data) {
                    this.setVehicleStatus("", false);
                    return data;
                }
            }

            this.setVehicleStatus("Vehicle info not found across VW / Audi / Skoda.", false);
            return null;
        },

        async fetchRecalls(vin, make) {
            this.setRecallStatus("Checking Kosmocar recalls…", true);
            const kosmocarResult = await window.KosmocarApi.fetchKosmocarRecalls(vin);
            const kosmocarSuccess = kosmocarResult.responded;
            const recalls = kosmocarResult.recalls;
            this.result.recalls = recalls;
            this.revealKosmocarResults(recalls.length > 0);

            if (!kosmocarSuccess) {
                this.recallStatusNote = "Kosmocar recall service unavailable.";
                this.setRecallStatus("Kosmocar recall service unavailable.", false);
            }

            if (make === 'VW') {
                this.setRecallStatus("Checking VW Global recalls…", true);
                const vwResult = await window.VWGlobalApi.fetchVWGlobalRecalls(vin);
                this.result.vwGlobalRecalls = vwResult.data;
                if (!vwResult.responded) {
                    this.recallStatusNote = "VW Global service unavailable.";
                    this.setRecallStatus("VW Global service unavailable.", false);
                }
            } else {
                this.result.vwGlobalRecalls = [];
            }

            this.revealRecallsContent();
            return recalls;
        },

        async fetchSuperEtkaQueueStatus(vin, options = {}) {
            if (!vin) return;
            const { indicateChecking = false } = options;
            const previousStatus = this.superEtkaQueue.status;
            if (indicateChecking || !previousStatus) {
                this.superEtkaQueue.status = 'checking';
            }
            try {
                const data = await window.SuperEtkaApi.fetchQueueStatus(this.superEtkaQueueApi, vin);
                if (data.ok) {
                    if (typeof data.decodedCount !== 'undefined') {
                        this.superEtkaQueue.decodedCount = data.decodedCount;
                    }
                    const apiStatus = (data.status || '').toLowerCase();
                    const position = data.position || '0/0';
                    this.superEtkaQueue.position = position;
                    this.superEtkaQueue.status = apiStatus || (position !== '0/0' ? 'pending' : '');
                    const inQueue = this.superEtkaQueue.status === 'pending' || position !== '0/0';
                    this.superEtkaQueue.enqueued = inQueue;
                    if (inQueue) {
                        this.startSuperEtkaQueuePolling(vin);
                    } else {
                        this.stopSuperEtkaQueuePolling();
                    }
                    if (this.superEtkaQueue.status === 'done' && previousStatus !== 'done') {
                        const reveal = () => {
                            this.superEtka.found = true;
                            this.superEtka.checked = true;
                            const links = window.SuperEtkaApi.buildHtmlLinks(vin);
                            this.superEtka.prHtml = links.prHtml;
                            this.superEtka.codingHtml = links.codingHtml;
                            this.setSuperEtkaStatus("", false);
                            this.superEtkaRevealReady = false;
                            this.$nextTick?.(() => requestAnimationFrame(() => (this.superEtkaRevealReady = true)));
                            this.superEtkaQueue.status = 'done';
                            this.stopSuperEtkaQueuePolling();
                        };
                        if (previousStatus === 'pending' || previousStatus === 'transition') {
                            this.superEtkaQueue.status = 'transition';
                            setTimeout(reveal, 200);
                        } else {
                            reveal();
                        }
                    }
                }
            } catch {
                this.superEtkaQueue.status = '';
                this.setSuperEtkaStatus("SuperETKA queue unavailable.", false);
            }
        },

        async fetchSuperEtkaDecodedStats() {
            try {
                const data = await window.SuperEtkaApi.fetchQueueStats(this.superEtkaQueueApi);
                if (data.ok && typeof data.decodedCount !== 'undefined') {
                    this.superEtkaQueue.decodedCount = data.decodedCount;
                }
            } catch {}
        },

        async enqueueSuperEtka() {
            const vin = this.result?.vin;
            if (!vin || this.superEtkaQueue.loading) return;
            this.superEtkaQueue.loading = true;
            this.superEtkaQueue.error = '';
            const previousStatus = this.superEtkaQueue.status;
            this.superEtkaQueue.status = 'pending';
            try {
                const data = await window.SuperEtkaApi.enqueueVin(this.superEtkaQueueApi, vin, this.superEtkaQueue.comment);
                if (data.ok) {
                    this.superEtkaQueue.position = data.position || '0/0';
                    this.superEtkaQueue.status = (data.status || 'pending').toLowerCase();
                    if (typeof data.decodedCount !== 'undefined') {
                        this.superEtkaQueue.decodedCount = data.decodedCount;
                    }
                    this.superEtkaQueue.enqueued = this.superEtkaQueue.status === 'pending' || this.superEtkaQueue.position !== '0/0';
                    this.superEtkaQueue.comment = '';
                    if (this.superEtkaQueue.enqueued) {
                        this.startSuperEtkaQueuePolling(vin);
                    }
                } else {
                    this.superEtkaQueue.error = 'Queue request failed. Try again later.';
                    this.superEtkaQueue.status = previousStatus;
                }
            } catch {
                this.superEtkaQueue.error = 'Failed to reach SuperETKA queue. Try again later.';
                this.superEtkaQueue.status = previousStatus;
            }
            this.superEtkaQueue.loading = false;
        },

        pickRandomTagline() {
            return window.Utils.pickRandomTagline(this);
        }
    };
}
