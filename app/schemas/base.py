"""Base model with camelCase alias support for frontend compatibility."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that accepts both camelCase and snake_case in requests
    and serializes responses as camelCase."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    def model_dump(self, **kwargs):
        return super().model_dump(by_alias=True, **kwargs)