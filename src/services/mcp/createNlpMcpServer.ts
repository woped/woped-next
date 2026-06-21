import type { LLMConfig } from "@/types/chat";
import type { ServicesConfig } from "@/types/config";
import { useConfigStore } from "@/stores/config";
import { usePetriNetStore } from "@/stores/petriNet";
import { createLocalMcpServer } from "./localMcpServer";
import { registerNlpTools } from "./registerNlpTools";

export function createNlpMcpServer(
  llmConfig?: LLMConfig,
  servicesConfig?: ServicesConfig,
) {
  const server = createLocalMcpServer();

  registerNlpTools(
    server,
    {
      getNet: () => usePetriNetStore().net,
    },
    llmConfig,
    servicesConfig ?? useConfigStore().services,
  );

  return server;
}
