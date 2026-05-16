/**
 * 21stc Governance Framework: Data Mapping Hub
 * Maps Institutional Contexts (School Codes) to System State
 */

const HubMapping = {
    // Hub Registry Database
    hubs: {
        'HUB-CH-01': {
            name: 'Skillstech Central Tamil Nadu',
            location: 'Chennai Hub',
            branding: {
                primary: '#3b82f6',
                accent: '#a855f7'
            },
            stats: {
                totalStudents: 2845,
                avgCompletion: '78%'
            }
        },
        'HUB-CBE-02': {
            name: 'Coimbatore Innovation Lab',
            location: 'Coimbatore West',
            branding: {
                primary: '#10b981', // Emerald
                accent: '#3b82f6'
            },
            stats: {
                totalStudents: 1240,
                avgCompletion: '82%'
            }
        }
    },

    // Institutional Data Mapper
    getHubData: (code) => {
        return HubMapping.hubs[code] || {
            name: 'Independent Student Hub',
            location: 'Global Region',
            branding: { primary: '#3b82f6', accent: '#a855f7' },
            stats: { totalStudents: 0, avgCompletion: '0%' }
        };
    },

    // Capability to map a student to their specific hub context
    getCurrentContext: () => {
        const code = localStorage.getItem('schoolCode') || 'GLOBAL';
        return HubMapping.getHubData(code);
    },

    // Simulating progress mapping for the Admin Dashboard
    getGlobalMetrics: () => {
        // Aggregate mapping across all hubs for System Admin
        return {
            totalEnrolled: 4085, // 2845 + 1240
            hubsActive: 2,
            globalAverage: '80%'
        };
    }
};

if (typeof window !== 'undefined') {
    window.HubMapping = HubMapping;
}
