import { DailyBonusState, DailyBonusReward } from '../types';
import { DAILY_BONUS_CONFIG, getDefaultDailyBonusState } from '../core/config';

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
        // Fix: old saves incremented totalLogins on login before claim.
        // Compensate by decrementing if today's reward hasn't been claimed yet.
        if (!this.state.claimedToday && this.state.totalLogins > 0
            && this.state.lastLoginDate !== '') {
            this.state.totalLogins--;
        }
        this.checkNewDay();
    }

    /** Returns true if a new day was detected and counters advanced */
    checkNewDay(): boolean {
        const today = DailyBonusSystem.getTodayUTC();
        if (this.state.lastLoginDate === today) return false;

        const isFirstEver = this.state.lastLoginDate === '';
        this.state.lastLoginDate = today;
        this.state.claimedToday = false;

        if (isFirstEver) {
            this.state.weekDay = 0;
        } else {
            this.state.weekDay = (this.state.weekDay + 1) % 7;
        }
        return true;
    }

    getTodayReward(): DailyBonusReward {
        return { ...DAILY_BONUS_CONFIG.weeklyRewards[this.state.weekDay] };
    }

    getRewardForDay(dayIndex: number): DailyBonusReward {
        return { ...DAILY_BONUS_CONFIG.weeklyRewards[dayIndex] };
    }

    claimDaily(): DailyBonusReward | null {
        if (this.state.claimedToday) return null;
        this.state.claimedToday = true;
        const reward = this.getTodayReward();

        this.state.totalLogins++;
        if (this.state.totalLogins > DAILY_BONUS_CONFIG.monthCycleDays) {
            this.state.totalLogins = 1;
            this.state.weekDay = 0;
            this.state.monthMilestonesClaimed = [false, false, false, false];
        }

        return reward;
    }

    claimMonthlyMilestone(index: number): number {
        const cfg = DAILY_BONUS_CONFIG;
        if (index < 0 || index >= cfg.milestoneThresholds.length) return 0;
        if (this.state.totalLogins < cfg.milestoneThresholds[index]) return 0;
        if (this.state.monthMilestonesClaimed[index]) return 0;
        this.state.monthMilestonesClaimed[index] = true;
        return cfg.milestoneRewards[index];
    }

    hasUnclaimedReward(): boolean {
        if (!this.state.claimedToday) return true;
        const cfg = DAILY_BONUS_CONFIG;
        for (let i = 0; i < cfg.milestoneThresholds.length; i++) {
            if (this.state.totalLogins >= cfg.milestoneThresholds[i]
                && !this.state.monthMilestonesClaimed[i]) return true;
        }
        return false;
    }

    get totalLogins(): number { return this.state.totalLogins; }
    get weekDay(): number { return this.state.weekDay; }
    get claimedToday(): boolean { return this.state.claimedToday; }
    get monthMilestonesClaimed(): readonly boolean[] { return this.state.monthMilestonesClaimed; }

    getSecondsUntilReset(): number {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1,
        ));
        return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
    }

    toSave(): DailyBonusState {
        return {
            ...this.state,
            monthMilestonesClaimed: [...this.state.monthMilestonesClaimed],
        };
    }

    static getTodayUTC(): string {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
}
