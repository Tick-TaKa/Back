FLOW_STEPS = {
    "reservation": ["Start", "Reservation", "TrainList", "SelectSeat", "Payment", "AddCard", "Payment", "End"],
    "reservation": ["Start", "Reservation", "TrainList", "SelectSeat", "Payment", "End"],
    "history": ["Start", "PhoneNumber", "History", "HistoryNone", "HistoryTicket"],
    "refund": ["Start", "PhoneNumber", "History", "HistoryNone", "HistoryTicket", "BookingDetail", "RefundSuccess"]
}