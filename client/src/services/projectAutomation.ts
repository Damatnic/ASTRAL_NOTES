/**
 * Project Automation Service
 * Automates repetitive tasks and workflows in projects
 */

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'note_created' | 'word_count_reached' | 'time_based' | 'tag_added';
  conditions: Record<string, any>;
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationAction {
  type: 'create_note' | 'add_tag' | 'send_notification' | 'backup_project';
  parameters: Record<string, any>;
}

export class ProjectAutomationService {
  private rules: Map<string, AutomationRule> = new Map();
  private executionLog: { ruleId: string; executedAt: string; result: string }[] = [];

  /**
   * Create automation rule
   */
  public createRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Execute automation rules based on trigger
   */
  public async executeRules(trigger: AutomationRule['trigger'], context: Record<string, any>): Promise<void> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && rule.trigger === trigger);

    for (const rule of applicableRules) {
      try {
        if (this.evaluateConditions(rule.conditions, context)) {
          await this.executeActions(rule.actions, context);
          this.logExecution(rule.id, 'success');
        }
      } catch (error) {
        this.logExecution(rule.id, `error: ${error}`);
      }
    }
  }

  /**
   * Get all automation rules
   */
  public getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Toggle rule enabled status
   */
  public toggleRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = !rule.enabled;
    this.rules.set(ruleId, rule);
    return rule.enabled;
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    // Simplified condition evaluation
    return Object.entries(conditions).every(([key, value]) => {
      return context[key] === value;
    });
  }

  private async executeActions(actions: AutomationAction[], context: Record<string, any>): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'create_note':
          // Implementation would create a note
          break;
        case 'add_tag':
          // Implementation would add tags
          break;
        case 'send_notification':
          // Implementation would send notification
          break;
        case 'backup_project':
          // Implementation would backup project
          break;
      }
    }
  }

  private logExecution(ruleId: string, result: string): void {
    this.executionLog.push({
      ruleId,
      executedAt: new Date().toISOString(),
      result
    });

    // Keep only last 100 executions
    if (this.executionLog.length > 100) {
      this.executionLog.shift();
    }
  }

  /**
   * Create automation - alias for createRule (test compatibility)
   */
  public createAutomation(projectId: string, automation: {
    name: string;
    description: string;
    trigger: string;
    action: string;
    targetEntity: string;
    status: string;
  }): { id: string; name: string; status: string; [key: string]: any } {
    const rule = this.createRule({
      name: automation.name,
      trigger: automation.trigger as AutomationRule['trigger'],
      conditions: { projectId },
      actions: [{
        type: automation.action as AutomationAction['type'],
        parameters: { targetEntity: automation.targetEntity }
      }],
      enabled: automation.status === 'active'
    });

    return {
      id: rule.id,
      name: rule.name,
      status: automation.status,
      description: automation.description,
      trigger: automation.trigger,
      action: automation.action,
      targetEntity: automation.targetEntity
    };
  }

  /**
   * Get automations for project (test compatibility)
   */
  public getAutomations(projectId: string): AutomationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.conditions.projectId === projectId);
  }

  /**
   * Trigger automation (test compatibility)
   */
  public async triggerAutomation(projectId: string, trigger: string, entityId: string, entityType: string): Promise<void> {
    await this.executeRules(trigger as AutomationRule['trigger'], {
      projectId,
      entityId,
      entityType
    });
  }
}

// Export singleton instance
export const projectAutomation = new ProjectAutomationService();
