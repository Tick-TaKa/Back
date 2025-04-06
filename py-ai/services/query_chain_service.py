from chains.chain import (
    run_current_action_chain,
    run_remaining_steps_chain,
    run_flow_summary_chain 
)

def query_current_action_chain(question: str, location: str, purpose: str) -> str:
    return run_current_action_chain(question, location, purpose)

def query_remaining_steps_chain(location: str, purpose: str):
    return run_remaining_steps_chain(location, purpose)

def query_flow_summary_chain(question: str, purpose: str) -> str:
    return run_flow_summary_chain(question, purpose)