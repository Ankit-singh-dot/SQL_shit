const mongoose = require('mongoose');

const sharedTableSchema = new mongoose.Schema({
    tableName: { type: String, required: true, unique: true },
    displayName: { type: String }, // friendly name for UI
    columns: [
        {
            name: { type: String, required: true },
            type: { type: String, required: true },
        },
    ],
    sampleData: [[mongoose.Schema.Types.Mixed]],
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SharedTable', sharedTableSchema);
