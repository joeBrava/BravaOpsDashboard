# Permissions setup (user action required)

Claude can't edit its own permission file (the harness blocks agents from self-escalating
permission mode — by design). So these two changes are **yours to apply** if you want them.

## 1. (Optional) Turn on bypass mode — zero approval prompts during the build

In-session, either:
- Press **Shift+Tab** to cycle permission modes until it shows **"bypass permissions"**, or
- Run **`/config`** and set the permission mode, or
- Restart with **`claude --dangerously-skip-permissions`**.

There's a one-time "dangerous mode" confirmation dialog — that's the acceptance Claude
can't click for you.

> Not required for the build to proceed. Without it we run in **auto mode**, which
> auto-approves the safe local operations (file edits, npm, tests) and only prompts on
> genuinely risky actions.

## 2. (Optional) Hard deny-rules — make external writes impossible even under bypass

Merge this `deny` array into `~/BBProjects/.claude/settings.local.json` under
`permissions` (alongside the existing `allow` array). Deny rules are enforced in **every**
mode, so external writes stay blocked even with bypass on. Read-only tools
(list/get/search/query) remain allowed.

```json
"deny": [
  "mcp__claude_ai_HubSpot__manage_crm_objects",
  "mcp__claude_ai_Teamwork__twprojects-add_project_member",
  "mcp__claude_ai_Teamwork__twprojects-clone_project",
  "mcp__claude_ai_Teamwork__twprojects-complete_task",
  "mcp__claude_ai_Teamwork__twprojects-complete_timer",
  "mcp__claude_ai_Teamwork__twprojects-create_comment",
  "mcp__claude_ai_Teamwork__twprojects-create_company",
  "mcp__claude_ai_Teamwork__twprojects-create_custom_field",
  "mcp__claude_ai_Teamwork__twprojects-create_custom_field_value",
  "mcp__claude_ai_Teamwork__twprojects-create_custom_item",
  "mcp__claude_ai_Teamwork__twprojects-create_custom_item_field",
  "mcp__claude_ai_Teamwork__twprojects-create_custom_item_record",
  "mcp__claude_ai_Teamwork__twprojects-create_jobrole",
  "mcp__claude_ai_Teamwork__twprojects-create_link",
  "mcp__claude_ai_Teamwork__twprojects-create_message",
  "mcp__claude_ai_Teamwork__twprojects-create_message_reply",
  "mcp__claude_ai_Teamwork__twprojects-create_milestone",
  "mcp__claude_ai_Teamwork__twprojects-create_notebook",
  "mcp__claude_ai_Teamwork__twprojects-create_project",
  "mcp__claude_ai_Teamwork__twprojects-create_project_category",
  "mcp__claude_ai_Teamwork__twprojects-create_project_template",
  "mcp__claude_ai_Teamwork__twprojects-create_skill",
  "mcp__claude_ai_Teamwork__twprojects-create_tag",
  "mcp__claude_ai_Teamwork__twprojects-create_task",
  "mcp__claude_ai_Teamwork__twprojects-create_tasklist",
  "mcp__claude_ai_Teamwork__twprojects-create_team",
  "mcp__claude_ai_Teamwork__twprojects-create_timelog",
  "mcp__claude_ai_Teamwork__twprojects-create_timer",
  "mcp__claude_ai_Teamwork__twprojects-create_user",
  "mcp__claude_ai_Teamwork__twprojects-create_workflow",
  "mcp__claude_ai_Teamwork__twprojects-create_workflow_stage",
  "mcp__claude_ai_Teamwork__twprojects-link_project_to_workflow",
  "mcp__claude_ai_Teamwork__twprojects-move_task_to_workflow_stage",
  "mcp__claude_ai_Teamwork__twprojects-pause_timer",
  "mcp__claude_ai_Teamwork__twprojects-resume_timer",
  "mcp__claude_ai_Teamwork__twprojects-update_comment",
  "mcp__claude_ai_Teamwork__twprojects-update_company",
  "mcp__claude_ai_Teamwork__twprojects-update_custom_field",
  "mcp__claude_ai_Teamwork__twprojects-update_custom_field_value",
  "mcp__claude_ai_Teamwork__twprojects-update_custom_item",
  "mcp__claude_ai_Teamwork__twprojects-update_custom_item_field",
  "mcp__claude_ai_Teamwork__twprojects-update_custom_item_record",
  "mcp__claude_ai_Teamwork__twprojects-update_jobrole",
  "mcp__claude_ai_Teamwork__twprojects-update_link",
  "mcp__claude_ai_Teamwork__twprojects-update_message",
  "mcp__claude_ai_Teamwork__twprojects-update_message_reply",
  "mcp__claude_ai_Teamwork__twprojects-update_milestone",
  "mcp__claude_ai_Teamwork__twprojects-update_notebook",
  "mcp__claude_ai_Teamwork__twprojects-update_project",
  "mcp__claude_ai_Teamwork__twprojects-update_project_category",
  "mcp__claude_ai_Teamwork__twprojects-update_skill",
  "mcp__claude_ai_Teamwork__twprojects-update_tag",
  "mcp__claude_ai_Teamwork__twprojects-update_task",
  "mcp__claude_ai_Teamwork__twprojects-update_tasklist",
  "mcp__claude_ai_Teamwork__twprojects-update_team",
  "mcp__claude_ai_Teamwork__twprojects-update_timelog",
  "mcp__claude_ai_Teamwork__twprojects-update_timer",
  "mcp__claude_ai_Teamwork__twprojects-update_user",
  "mcp__claude_ai_Teamwork__twprojects-update_workflow",
  "mcp__claude_ai_Teamwork__twprojects-update_workflow_stage",
  "mcp__claude_ai_Teamwork__twdesk-create_company",
  "mcp__claude_ai_Teamwork__twdesk-create_customer",
  "mcp__claude_ai_Teamwork__twdesk-create_file",
  "mcp__claude_ai_Teamwork__twdesk-create_priority",
  "mcp__claude_ai_Teamwork__twdesk-create_status",
  "mcp__claude_ai_Teamwork__twdesk-create_tag",
  "mcp__claude_ai_Teamwork__twdesk-create_ticket",
  "mcp__claude_ai_Teamwork__twdesk-create_ticket_type",
  "mcp__claude_ai_Teamwork__twdesk-reply_ticket",
  "mcp__claude_ai_Teamwork__twdesk-update_company",
  "mcp__claude_ai_Teamwork__twdesk-update_customer",
  "mcp__claude_ai_Teamwork__twdesk-update_priority",
  "mcp__claude_ai_Teamwork__twdesk-update_status",
  "mcp__claude_ai_Teamwork__twdesk-update_tag",
  "mcp__claude_ai_Teamwork__twdesk-update_ticket",
  "mcp__claude_ai_Teamwork__twdesk-update_ticket_type"
]
```

(QuickBooks has no connector at all, so it's already unreachable.)
