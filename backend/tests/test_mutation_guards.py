from uuid import uuid4

import pytest

from grail.auth.mutations import MUTATION_PERMISSIONS, guard_mutation
from grail.auth.roles import Role
from grail.errors import Forbidden
from grail.organizations.models import Membership

ORG = uuid4()


def readonly() -> Membership:
    return Membership(
        organization_id=ORG,
        user_subject="tomas",
        display_name="Tomás Silva",
        roles=frozenset({Role.READ_ONLY_REVIEWER}),
        active=True,
    )


@pytest.mark.parametrize("action", list(MUTATION_PERMISSIONS))
def test_read_only_reviewer_receives_403_for_mutations(action: str) -> None:
    with pytest.raises(Forbidden) as caught:
        guard_mutation(readonly(), ORG, action)
    assert caught.value.status_code == 403
