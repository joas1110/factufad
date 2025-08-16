from datetime import datetime
from typing import Tuple

def period_bounds(period: str, from_s: str = None, to_s: str = None) -> Tuple[datetime, datetime]:
    if from_s and to_s:
        return (datetime.fromisoformat(from_s), datetime.fromisoformat(to_s))
    now = datetime.utcnow()
    if period == 'daily':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == 'weekly':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start = start.replace(day=now.day - now.weekday())
        end = start.replace(day=start.day + 6, hour=23, minute=59, second=59, microsecond=999999)
    else:  # monthly
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year+1, month=1, day=1)                 .replace(microsecond=999999, second=59, minute=59, hour=23)
        else:
            end = start.replace(month=start.month+1, day=1)                 .replace(microsecond=999999, second=59, minute=59, hour=23)
    return start, end
