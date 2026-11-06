from app.schemas.pagination import PaginatedResponse


def test_paginated_response_generic_model_validation():
    payload = PaginatedResponse[int](
        items=[1, 2, 3],
        total=3,
        page=1,
        page_size=20,
        total_pages=1,
        has_next=False,
        has_prev=False,
    )

    assert payload.items == [1, 2, 3]
