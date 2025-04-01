import os
from utils.tsx_parser import parse_tsx_file
from utils.vector_doc_builder import build_text_chunk_from_ui_doc

tsx_dir = "tsx"
output_dir = "parsed_docs"

# 프론트에서 넘겨주는 flow 값 수동 설정
PURPOSE = ''
RESERVATION = ['Start', 'Reservation', 'TrainList', 'SelectSeat', 'Payment', 'AddCard', 'End']
HISTORY = ['Start', 'PhoneNumber', 'History', 'HistoryNone', 'HistoryTicket']
REFUND = ['Start', 'PhoneNumber', 'History', 'HistoryNone', 'HistoryTicket', 'BookingDetail', 'RefundSuccess']

# 목적 추론 함수
def guess_purpose_from_page(page_name: str) -> str:
    purposes = []
    if page_name in RESERVATION:
        purposes.append("reservation")
    if page_name in HISTORY:
        purposes.append("history")
    if page_name in REFUND:
        purposes.append("refund")
    return ", ".join(purposes) if purposes else "reservation"


# 파일 반복 처리
for filename in os.listdir(tsx_dir):
    if filename.endswith(".tsx"):
        page_name = filename.replace(".tsx", "")
        tsx_path = os.path.join(tsx_dir, filename)

        PURPOSE = guess_purpose_from_page(page_name)

        try:
            ui_doc = parse_tsx_file(tsx_path, page_name=page_name, purpose=PURPOSE)
        except Exception as e:
            print(f"❌ {page_name}: 파싱 실패 - {e}")
            continue

        text_chunk = build_text_chunk_from_ui_doc(ui_doc)

        output_path = os.path.join(output_dir, f"{page_name}.txt")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text_chunk)

        print(f"✅ {page_name} 저장 완료 (purpose: {PURPOSE})")