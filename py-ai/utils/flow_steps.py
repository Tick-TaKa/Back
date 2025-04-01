FLOW_STEPS = {
    "reservation": ["Start", "Reservation", "TrainList", "SelectSeat", "Payment", "AddCard", "End"],
    "history": ["Start", "PhoneNumber", "History", "HistoryNone", "HistoryTicket"],
    "refund": ["Start", "PhoneNumber", "History", "HistoryNone", "HistoryTicket", "BookingDetail", "RefundSuccess"]
}