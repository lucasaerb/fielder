import { simpleHandoffScenario } from './simpleHandoff';
import { customerServiceRetailScenario } from './customerServiceRetail';
import { chatSupervisorScenario } from './chatSupervisor';
import { therapyRoleplayScenario } from './therapyRoleplay';
import { discoveryAgentScenario } from './discoveryAgent';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetailScenario: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  therapyRoleplay: therapyRoleplayScenario,
  discoveryAgent: discoveryAgentScenario,
};

export const defaultAgentSetKey = 'chatSupervisor';
