import { QuestState, QuestProgress, OnlineQuestProgress, Grade, RollResult } from '../types';
import { QUEST_CONFIG, getDefaultQuestState, GRADE_ORDER, QuestStepReward } from '../core/config';
import { getTodayUTC, getSecondsUntilReset } from '../core/DateUtils';

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
        const today = getTodayUTC();
        if (this.state.lastResetDate === today) return false;
        this.state.lastResetDate = today;
        this.state.rollQuest = { current: 0, target: QUEST_CONFIG.rollSteps[0].target, sequenceIndex: 0 };
        const gs = QUEST_CONFIG.gradeSteps[0];
        this.state.gradeQuest = { current: 0, target: gs.target, sequenceIndex: 0 };
        this.state.onlineQuest = { current: 0, target: QUEST_CONFIG.onlineSteps[0].target * 60, sequenceIndex: 0 };
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
                gq.current = Math.min(gq.current + 1, gq.target);
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
        const steps = QUEST_CONFIG.onlineSteps;
        const step = steps[Math.min(oq.sequenceIndex, steps.length - 1)];
        oq.target = step.target * 60;
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

    // ── Reward getters (per current step) ──

    getReward(type: QuestType): QuestStepReward {
        if (type === 'roll') {
            const steps = QUEST_CONFIG.rollSteps;
            return steps[Math.min(this.state.rollQuest.sequenceIndex, steps.length - 1)];
        }
        if (type === 'grade') {
            const steps = QUEST_CONFIG.gradeSteps;
            return steps[Math.min(this.state.gradeQuest.sequenceIndex, steps.length - 1)];
        }
        const steps = QUEST_CONFIG.onlineSteps;
        return steps[Math.min(this.state.onlineQuest.sequenceIndex, steps.length - 1)];
    }

    // ── Existing quest methods ──

    claimRollQuest(): boolean {
        const q = this.state.rollQuest;
        if (!this.isComplete(q)) return false;
        q.sequenceIndex++;
        const steps = QUEST_CONFIG.rollSteps;
        q.target = steps[Math.min(q.sequenceIndex, steps.length - 1)].target;
        q.current = 0;
        return true;
    }

    claimGradeQuest(): boolean {
        const q = this.state.gradeQuest;
        if (!this.isComplete(q)) return false;
        q.sequenceIndex++;
        const steps = QUEST_CONFIG.gradeSteps;
        const step = steps[Math.min(q.sequenceIndex, steps.length - 1)];
        q.target = step.target;
        q.current = 0;
        return true;
    }

    isRollQuestComplete(): boolean { return this.isComplete(this.state.rollQuest); }
    isGradeQuestComplete(): boolean { return this.isComplete(this.state.gradeQuest); }

    getRollQuest(): Readonly<QuestProgress> { return this.state.rollQuest; }
    getGradeQuest(): Readonly<QuestProgress> { return this.state.gradeQuest; }

    getRequiredGrade(): Grade {
        const steps = QUEST_CONFIG.gradeSteps;
        return steps[Math.min(this.state.gradeQuest.sequenceIndex, steps.length - 1)].grade;
    }

    getRollTarget(): number {
        const steps = QUEST_CONFIG.rollSteps;
        return steps[Math.min(this.state.rollQuest.sequenceIndex, steps.length - 1)].target;
    }

    getSecondsUntilReset(): number {
        return getSecondsUntilReset();
    }

    toSave(): QuestState {
        return { ...this.state,
            rollQuest: { ...this.state.rollQuest },
            gradeQuest: { ...this.state.gradeQuest },
            onlineQuest: { ...this.state.onlineQuest },
            milestones: { ...this.state.milestones, claimedMilestones: [...this.state.milestones.claimedMilestones] },
        };
    }

    private isComplete(q: QuestProgress): boolean {
        return q.current >= q.target;
    }

    private isGradeAtLeast(got: Grade, required: Grade): boolean {
        return GRADE_ORDER.indexOf(got) >= GRADE_ORDER.indexOf(required);
    }
}
