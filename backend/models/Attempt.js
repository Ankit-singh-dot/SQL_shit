const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    mcqAnswers: [{
        questionIndex: { type: Number },
        selectedOptionIndex: { type: Number },
        isCorrect: { type: Boolean }
    }],
    codingAnswers: [{
        questionIndex: { type: Number },
        query: { type: String },
        isCorrect: { type: Boolean }
    }],
    score: { type: Number, default: 0 },
    totalMaxScore: { type: Number, default: 0 },
    isFullyCorrect: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
