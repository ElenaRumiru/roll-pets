import { QuestState, QuestProgress, Grade, RollResult } from '../types';
import { QUEST_CONFIG, getDefaultQuestState, GRADE_ORDER } from '../core/config';

export class QuestSystem {
    private state: QuestState;

    constructor() {
        this.state = getDefaultQuestState();
    }

    loadFromSave(state: QuestState): void {
        this.state = { ...state };
        this.checkDailyReset();
    }

    checkDailyReset(): boolean {
        const today = QuestSystem.getTodayUTC();
        if (this.state.lastResetDate === today) return false;
        this.state.lastResetDate = today;
        this.state.rollQuest = { current: 0, target: QUEST_CONFIG.rollSequence[0], sequenceIndex: 0 };
        this.state.gradeQuest = { current: 0, target: 1, sequenceIndex: 0 };
        return true;
    }

    onRollComplete(result: RollResult): void {
        this.checkDailyReset();

        const rq = this.state.rollQuest;
        if (!this.isComplete(rq)) {
            rq.current = Math.min(rq.current + 1, rq.target);
        }

        const gq = this.state.gradeQuest;
        if (!this.isComplete(gq)) {
            const required = this.getRequiredGrade();
            if (this.isGradeAtLeast(result.grade, required)) {
                gq.current = 1;
            }
        }
    }

    claimRollQuest(): boolean {
        const q = this.state.rollQuest;
        if (!this.isComplete(q)) return false;
        q.sequenceIndex++;
        const seq = QUEST_CONFIG.rollSequence;
        q.target = seq[Math.min(q.sequenceIndex, seq.length - 1)];
        q.current = 0;
        return true;
    }

    claimGradeQuest(): boolean {
        const q = this.state.gradeQuest;
        if (!this.isComplete(q)) return false;
        q.sequenceIndex++;
        q.current = 0;
        q.target = 1;
        return true;
    }

    isRollQuestComplete(): boolean { return this.isComplete(this.state.rollQuest); }
    isGradeQuestComplete(): boolean { return this.isComplete(this.state.gradeQuest); }

    getRollQuest(): Readonly<QuestProgress> { return this.state.rollQuest; }
    getGradeQuest(): Readonly<QuestProgress> { return this.state.gradeQuest; }

    getRequiredGrade(): Grade {
        const seq = QUEST_CONFIG.gradeSequence;
        return seq[Math.min(this.state.gradeQuest.sequenceIndex, seq.length - 1)];
    }

    getRollTarget(): number {
        const seq = QUEST_CONFIG.rollSequence;
        return seq[Math.min(this.state.rollQuest.sequenceIndex, seq.length - 1)];
    }

    toSave(): QuestState {
        return { ...this.state,
            rollQuest: { ...this.state.rollQuest },
            gradeQuest: { ...this.state.gradeQuest },
        };
    }

    static getTodayUTC(): string {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }

    private isComplete(q: QuestProgress): boolean {
        return q.current >= q.target;
    }

    private isGradeAtLeast(got: Grade, required: Grade): boolean {
        return GRADE_ORDER.indexOf(got) >= GRADE_ORDER.indexOf(required);
    }
}
