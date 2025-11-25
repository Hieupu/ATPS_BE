class ExamSection {
    constructor({
        SectionId,
        ExamId,
        Type,
        OrderIndex,
        questions
    }) {
        this.SectionId = SectionId ?? null;
        this.ExamId = ExamId;
        this.Type = Type;
        this.OrderIndex = OrderIndex ?? 0;
        this.questions = questions ?? [];
    }
}

module.exports = ExamSection;