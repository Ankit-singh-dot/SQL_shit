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

const mcqSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }
}, { _id: false });

const codingQuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    expectedQuery: { type: String, required: true },
    hints: [String]
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy',
    },
    category: {
        type: String,
        enum: ['Basics', 'Filtering', 'Aggregation', 'Joins', 'Subqueries', 'Advanced'],
        default: 'Basics',
    },
    mcqTimeLimit: { type: Number, default: 0 }, // seconds
    codingTimeLimit: { type: Number, default: 0 }, // seconds
    tableMode: { type: String, enum: ['custom', 'existing'], default: 'custom' },
    sharedTableNames: [String],
    tables: [tableSchema],
    mcqs: [mcqSchema],
    codingQuestions: [codingQuestionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
