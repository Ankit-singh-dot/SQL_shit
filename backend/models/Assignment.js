const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    tableName: { type: String, required: true },
    columns: [
        {
            name: { type: String },
            type: { type: String },
        },
    ],
    sampleData: [[mongoose.Schema.Types.Mixed]],
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy',
    },
    tables: [tableSchema],
    expectedQuery: { type: String }, // reference solution (not shown to user)
    hints: [String],
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
