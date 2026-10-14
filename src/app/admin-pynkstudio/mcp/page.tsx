import type { Metadata } from "next";
import { PynkMcpManager } from "@/components/admin-pynkstudio/pynk-mcp-manager";
export const metadata:Metadata={title:"MCP · PynkStudio"};
export default function Page(){return <PynkMcpManager/>}
