from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, UserRolle
from .auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    uid = decode_token(token)
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ungültiger Token")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Benutzer nicht gefunden")
    return user


def require_trainer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rolle not in (UserRolle.trainer, UserRolle.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trainer-Rechte erforderlich")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rolle != UserRolle.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin-Rechte erforderlich")
    return current_user
