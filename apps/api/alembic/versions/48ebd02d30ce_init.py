"""init

Revision ID: 48ebd02d30ce
Revises: 
Create Date: 2026-04-08 09:03:14.720665

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '48ebd02d30ce'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=True),
    sa.Column('password', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('analyses',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('image_url', sa.String(), nullable=True),
    sa.Column('item_name', sa.String(), nullable=False),
    sa.Column('estimated_min', sa.Float(), nullable=False),
    sa.Column('estimated_max', sa.Float(), nullable=False),
    sa.Column('avg_price', sa.Float(), nullable=False),
    sa.Column('confidence', sa.Float(), nullable=False),
    sa.Column('platforms', sa.JSON(), nullable=False),
    sa.Column('tips', sa.ARRAY(sa.String()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analyses_created_at'), 'analyses', ['created_at'], unique=False)
    op.create_index(op.f('ix_analyses_user_id'), 'analyses', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_analyses_user_id'), table_name='analyses')
    op.drop_index(op.f('ix_analyses_created_at'), table_name='analyses')
    op.drop_table('analyses')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
