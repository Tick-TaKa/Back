from chains.chain import (
    run_current_action_chain,
    run_remaining_steps_chain,
    run_flow_summary_chain 
)
from services.models import CurrentSessionDBRequest, CompletedSessionDBRequest

def query_current_action_chain(
    question: str,
    location: str,
    purpose: str,
    current_session: CurrentSessionDBRequest,
    completed_session: CompletedSessionDBRequest
) -> str:
    return run_current_action_chain(
        question,
        location,
        purpose,
        current_session,
        completed_session
    )

def query_remaining_steps_chain(location: str, purpose: str):
    return run_remaining_steps_chain(location, purpose)

def query_flow_summary_chain(question: str, purpose: str) -> str:
    return run_flow_summary_chain(question, purpose)
