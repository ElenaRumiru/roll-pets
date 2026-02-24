import { QuestState, QuestProgress, OnlineQuestProgress, Grade, RollResult } from '../types';
import { QUEST_CONFIG, getDefaultQuestState, GRADE_ORDER } from '../core/config';

export type QuestType = 'roll' | 'grade' | 'online';

interface VisibleQuest {
    type: QuestType;
    current: number;
    target: number;
    complete: boolean;
}

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
        const onlineSeq = QUEST_CONFIG.onlineSequence;
        this.state.onlineQuest = { current: 0, target: onlineSeq[0] * 60, sequenceIndex: 0 };
        this.state.milestones = { completedCount: 0, claimedMilestones: [] };
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

    // ── Online quest ──

    updateOnlineTime(deltaSec: number): boolean {
        const oq = this.state.onlineQuest;
        if (this.isOnlineComplete()) return false;
        const before = oq.current;
        oq.current = Math.min(oq.current + deltaSec, oq.target);
        return Math.floor(oq.current) !== Math.floor(before);
    }

    isOnlineComplete(): boolean {
        return this.state.onlineQuest.current >= this.state.onlineQuest.target;
    }

    getOnlineQuest(): Readonly<OnlineQuestProgress> { return this.state.onlineQuest; }

    claimOnlineQuest(): boolean {
        const oq = this.state.onlineQuest;
        if (!this.isOnlineComplete()) return false;
        oq.sequenceIndex++;
        const seq = QUEST_CONFIG.onlineSequence;
        oq.target = seq[Math.min(oq.sequenceIndex, seq.length - 1)] * 60;
        oq.current = 0;
        return true;
    }

    // ── Milestones ──

    incrementMilestoneCount(): void {
        this.state.milestones.completedCount++;
    }

    getMilestones() { return this.state.milestones; }

    claimMilestone(index: number): number {
        const ms = this.state.milestones;
        const threshold = QUEST_CONFIG.milestonesAt[index];
        if (ms.completedCount < threshold) return 0;
        if (ms.claimedMilestones.includes(index)) return 0;
        ms.claimedMilestones.push(index);
        return QUEST_CONFIG.milestoneRewards[index];
    }

    getClaimableMilestoneCount(): number {
        const ms = this.state.milestones;
        let count = 0;
        for (let i = 0; i < QUEST_CONFIG.milestonesAt.length; i++) {
            if (ms.completedCount >= QUEST_CONFIG.milestonesAt[i]
                && !ms.claimedMilestones.includes(i)) {
                count++;
            }
        }
        return count;
    }

    // ── Display priority (pick 2 of 3) ──

    getVisibleQuests(): VisibleQuest[] {
        const all: VisibleQuest[] = [
            { type: 'roll', current: this.state.rollQuest.current, target: this.state.rollQuest.target, complete: this.isRollQuestComplete() },
            { type: 'grade', current: this.state.gradeQuest.current, target: this.state.gradeQuest.target, complete: this.isGradeQuestComplete() },
            { type: 'online', current: Math.floor(this.state.onlineQuest.current), target: this.state.onlineQuest.target, complete: this.isOnlineComplete() },
        ];
        all.sort((a, b) => {
            if (a.complete !== b.complete) return a.complete ? -1 : 1;
            const ratioA = a.target > 0 ? a.current / a.target : 0;
            const ratioB = b.target > 0 ? b.current / b.target : 0;
            return ratioB - ratioA;
        });
        return all.slice(0, 2);
    }

    getTotalClaimableCount(): number {
        let count = 0;
        if (this.isRollQuestComplete()) count++;
        if (this.isGradeQuestComplete()) count++;
        if (this.isOnlineComplete()) count++;
        count += this.getClaimableMilestoneCount();
        return count;
    }

    // ── Existing quest methods ──

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

    getSecondsUntilReset(): number {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
    }

    toSave(): QuestState {
        return { ...this.state,
            rollQuest: { ...this.state.rollQuest },
            gradeQuest: { ...this.state.gradeQuest },
            onlineQuest: { ...this.state.onlineQuest },
            milestones: { ...this.state.milestones, claimedMilestones: [...this.state.milestones.claimedMilestones] },
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
