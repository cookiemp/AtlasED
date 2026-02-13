const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] AtlasED preload script loading...');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('atlased', {
    // Window controls
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close')
    },

    // Settings
    settings: {
        get: (key) => ipcRenderer.invoke('settings:get', key),
        set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
        getAll: () => ipcRenderer.invoke('settings:getAll')
    },

    // Database: Expeditions
    expeditions: {
        create: (data) => ipcRenderer.invoke('db:createExpedition', data),
        getAll: () => ipcRenderer.invoke('db:getExpeditions'),
        get: (id) => ipcRenderer.invoke('db:getExpedition', id),
        delete: (id) => ipcRenderer.invoke('db:deleteExpedition', id),
        update: (id, data) => ipcRenderer.invoke('db:updateExpedition', id, data)
    },

    // Database: Waypoints
    waypoints: {
        create: (data) => ipcRenderer.invoke('db:createWaypoint', data),
        getAll: (expeditionId) => ipcRenderer.invoke('db:getWaypoints', expeditionId),
        get: (id) => ipcRenderer.invoke('db:getWaypoint', id),
        updateProgress: (id, position) => ipcRenderer.invoke('db:updateWaypointProgress', id, position),
        markCharted: (id) => ipcRenderer.invoke('db:markWaypointCharted', id),
        updateTranscript: (id, transcript) => ipcRenderer.invoke('db:updateWaypointTranscript', id, transcript)
    },

    // Database: Field Guides
    fieldGuides: {
        create: (data) => ipcRenderer.invoke('db:createFieldGuide', data),
        get: (waypointId) => ipcRenderer.invoke('db:getFieldGuide', waypointId),
        update: (waypointId, data) => ipcRenderer.invoke('db:updateFieldGuide', waypointId, data)
    },

    // Database: Tags
    tags: {
        create: (name) => ipcRenderer.invoke('db:createTag', name),
        getAll: () => ipcRenderer.invoke('db:getTags'),
        addToWaypoint: (waypointId, tagId) => ipcRenderer.invoke('db:addWaypointTag', waypointId, tagId),
        getForWaypoint: (waypointId) => ipcRenderer.invoke('db:getWaypointTags', waypointId)
    },

    // Database: Quiz Attempts
    quizAttempts: {
        create: (data) => ipcRenderer.invoke('db:createQuizAttempt', data),
        getAll: (waypointId) => ipcRenderer.invoke('db:getQuizAttempts', waypointId)
    },

    // Database: Memory Checkpoints (SRS)
    memoryCheckpoints: {
        getAll: () => ipcRenderer.invoke('db:getMemoryCheckpoints')
    },

    // Database: Notes
    notes: {
        get: (waypointId) => ipcRenderer.invoke('db:getNote', waypointId),
        upsert: (waypointId, content) => ipcRenderer.invoke('db:upsertNote', waypointId, content)
    },

    // Knowledge Graph
    knowledgeGraph: {
        getData: () => ipcRenderer.invoke('db:getKnowledgeGraphData')
    },

    // AI Services
    ai: {
        fetchTranscript: (videoId) => ipcRenderer.invoke('ai:fetchTranscript', videoId),
        generateFieldGuide: (transcript, videoTitle) => ipcRenderer.invoke('ai:generateFieldGuide', transcript, videoTitle),
        generateQuizzes: (transcript, videoTitle) => ipcRenderer.invoke('ai:generateQuizzes', transcript, videoTitle),
        validateApiKey: (apiKey) => ipcRenderer.invoke('ai:validateApiKey', apiKey),
        fetchPlaylist: (url) => ipcRenderer.invoke('ai:fetchPlaylist', url),
        chat: (message, transcript, videoTitle, previousMessages) => ipcRenderer.invoke('ai:chat', message, transcript, videoTitle, previousMessages)
    }
});

