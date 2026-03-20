import { DailyBonusState, DailyBonusReward } from '../types';
import { DAILY_BONUS_CONFIG, getDefaultDailyBonusState } from '../core/config';
import { getTodayUTC, getSecondsUntilReset } from '../core/DateUtils';

export type CardState = 'claimed' | 'pending' | 'future';

export class DailyBonusSystem {
    private state: DailyBonusState;

    constructor() {
        this.state = getDefaultDailyBonusState();
    }

    loadFromSave(state: DailyBonusState): void {
        this.state = {
            ...state,
            monthMilestonesClaimed: [...state.monthMilestonesClaimed],
        };
        this.checkNewDay();
    }

    /** Returns true if a new day was detected and pending counter advanced */
    checkNewDay(): boolean {
        const today = getTodayUTC();
        if (this.state.lastLoginDate === today) return false;
        this.state.lastLoginDate = today;
        this.state.pendingDays++;
        return true;
    }

    /** Claim all pending days at once. Returns array of rewards (empty if nothing to claim). */
    claimAll(): DailyBonusReward[] {
        if (this.state.pendingDays <= 0) return [];
        const rewards: DailyBonusReward[] = [];
        const maxDays = DAILY_BONUS_CONFIG.monthCycleDays;

        for (let i = 0; i < this.state.pendingDays; i++) {
            const dayIdx = (this.state.totalClaimedDays + i) % 7;
            rewards.push({ ...DAILY_BONUS_CONFIG.weeklyRewards[dayIdx] });
        }

        this.state.totalClaimedDays += this.state.pendingDays;
        this.state.pendingDays = 0;

        if (this.state.totalClaimedDays > maxDays) {
            this.state.totalClaimedDays -= maxDays;
            this.state.monthMilestonesClaimed = [false, false, false, false];
        }

        return rewards;
    }

    getRewardForDay(dayIndex: number): DailyBonusReward {
        return { ...DAILY_BONUS_CONFIG.weeklyRewards[dayIndex] };
    }

    /** Card state for the 7-day card grid */
    getCardState(dayIdx: number): CardState {
        const weekPos = this.state.totalClaimedDays % 7;
        const pendingInView = Math.min(this.state.pendingDays, 7 - weekPos);

        if (dayIdx < weekPos) return 'claimed';
        if (dayIdx >= weekPos && dayIdx < weekPos + pendingInView) return 'pending';
        return 'future';
    }

    claimMonthlyMilestone(index: number): number {
        const cfg = DAILY_BONUS_CONFIG;
        if (index < 0 || index >= cfg.milestoneThresholds.length) return 0;
        if (this.state.totalClaimedDays < cfg.milestoneThresholds[index]) return 0;
        if (this.state.monthMilestonesClaimed[index]) return 0;
        this.state.monthMilestonesClaimed[index] = true;
        return cfg.milestoneRewards[index];
    }

    hasUnclaimedReward(): boolean {
        if (this.state.pendingDays > 0) return true;
        const cfg = DAILY_BONUS_CONFIG;
        for (let i = 0; i < cfg.milestoneThresholds.length; i++) {
            if (this.state.totalClaimedDays >= cfg.milestoneThresholds[i]
                && !this.state.monthMilestonesClaimed[i]) return true;
        }
        return false;
    }

    get totalClaimedDays(): number { return this.state.totalClaimedDays; }
    get totalLogins(): number { return this.state.totalClaimedDays; }
    get weekDay(): number { return this.state.totalClaimedDays % 7; }
    get pendingDays(): number { return this.state.pendingDays; }
    get hasPending(): boolean { return this.state.pendingDays > 0; }
    get monthMilestonesClaimed(): readonly boolean[] { return this.state.monthMilestonesClaimed; }

    getSecondsUntilReset(): number {
        return getSecondsUntilReset();
    }

    toSave(): DailyBonusState {
        return {
            ...this.state,
            monthMilestonesClaimed: [...this.state.monthMilestonesClaimed],
        };
    }
}
