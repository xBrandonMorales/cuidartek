from fastapi import APIRouter, HTTPException, Depends
from models.paciente_model import PacienteModel
from models.usuario_model import UsuarioModel
from schemas.paciente_schema import Paciente, PacienteCreate, PacienteUpdate
from auth import require_role, require_medico, get_current_active_user
from typing import List

router = APIRouter(prefix="/pacientes", tags=["pacientes"])

@router.post("/", response_model=Paciente, dependencies=[Depends(require_medico)])
async def crear_paciente(paciente: PacienteCreate):
    try:
        nuevo_paciente = PacienteModel.create(paciente.dict())
        if not nuevo_paciente:
            raise HTTPException(status_code=500, detail="Error al crear paciente")
        return nuevo_paciente
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[Paciente], dependencies=[Depends(require_medico)])
async def listar_pacientes():
    try:
        pacientes = PacienteModel.get_all()
        return pacientes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{paciente_id}", response_model=Paciente)
async def obtener_paciente(
    paciente_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    try:
        paciente = PacienteModel.get_by_id(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        # Pacientes solo pueden ver su propia información
        if current_user["rol"] == "paciente":
            paciente_usuario = PacienteModel.get_by_usuario_id(current_user["id_usuario"])
            if not paciente_usuario or paciente_usuario["id_paciente"] != paciente_id:
                raise HTTPException(status_code=403, detail="No tiene permisos para ver este paciente")
        
        return paciente
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usuario/{usuario_id}", response_model=Paciente)
async def obtener_paciente_por_usuario(
    usuario_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    try:
        # Usuarios solo pueden ver su propia información
        if current_user["rol"] == "paciente" and current_user["id_usuario"] != usuario_id:
            raise HTTPException(status_code=403, detail="No tiene permisos para ver esta información")
        
        paciente = PacienteModel.get_by_usuario_id(usuario_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado para este usuario")
        return paciente
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{paciente_id}", response_model=Paciente, dependencies=[Depends(require_medico)])
async def actualizar_paciente(paciente_id: int, paciente: PacienteUpdate):
    try:
        paciente_existente = PacienteModel.get_by_id(paciente_id)
        if not paciente_existente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        paciente_actualizado = PacienteModel.update(paciente_id, paciente.dict(exclude_unset=True))
        return paciente_actualizado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{paciente_id}", dependencies=[Depends(require_medico)])
async def eliminar_paciente(paciente_id: int):
    try:
        paciente_existente = PacienteModel.get_by_id(paciente_id)
        if not paciente_existente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        eliminado = PacienteModel.delete(paciente_id)
        if not eliminado:
            raise HTTPException(status_code=500, detail="Error al eliminar paciente")
        
        return {"message": "Paciente eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))