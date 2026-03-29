import json
from datetime import datetime
from typing import Optional, Union

from mcp.server.fastmcp import FastMCP, Context
from sqlalchemy import desc

# Importas os modelos
from db import session_local, Patient, SessionLog

mcp = FastMCP("clinical-mcp")

def serialize_date(dt):
    """Converte datetime para string para o JSON não quebrar"""
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)


@mcp.tool()
async def buscar_paciente(nome_parcial: str, ctx: Context) -> str:
    """
    Busca um paciente pelo nome (ou parte dele).
    Retorna ID, Nome, Queixa, Valor, Dívida e Dados de Agendamento (Dia/Hora).
    """
    print(f"🔍 [TOOL] Buscando paciente: '{nome_parcial}'")
    await ctx.info(f"🔎 Iniciando busca no banco de dados por: '{nome_parcial}'...")
    session = session_local()
    try:
        results = session.query(Patient).filter(
            Patient.full_name.ilike(f"%{nome_parcial}%")
        ).all()
        
        if not results:
            return json.dumps({"status": "not_found", "message": "Nenhum paciente encontrado."})
        
        dias_semana = {0: "Segunda", 1: "Terça", 2: "Quarta", 3: "Quinta", 4: "Sexta", 5: "Sábado", 6: "Domingo"}

        patients_data = []
        for p in results:
            dia_txt = dias_semana.get(p.recurrence_week_day, "Não definido") if p.recurrence_week_day is not None else "Não definido"
            
            patients_data.append({
                "id": p.id,
                "nome": p.full_name,
                "queixa": p.main_complaint,
                "valor_sessao": p.hourly_rate,
                "divida_atual": p.current_debt,
                "contato": p.contact_info,
                "agendamento_padrao": f"{dia_txt} às {p.recurrence_time}" if p.recurrence_time else "Sem agendamento fixo"
            })
            
        return json.dumps(patients_data, ensure_ascii=False, indent=2)
    
    except Exception as e:
        return f"Erro ao buscar paciente: {str(e)}"
    finally:
        session.close()

@mcp.tool()
async def criar_paciente(
    full_name: str, 
    main_complaint: str, 
    hourly_rate: float, 
    birth_date: str, 
    contact_info: str,
    ctx: Context,  # Injeção do Contexto
    recurrence_week_day: int = None,
    recurrence_time: str = None
) -> str:
    """
    Cadastra um novo paciente no sistema.
    """
    await ctx.info(f"📝 Preparando para cadastrar: {full_name}")
    
    session = session_local()
    try:
        # FLEXIBILIDADE DE DATA PARA NASCIMENTO
        clean_date = birth_date.replace("/", "-")
        try:
            dt_nascimento = datetime.strptime(clean_date, "%d-%m-%Y")
        except ValueError:
            try:
                dt_nascimento = datetime.strptime(clean_date, "%Y-%m-%d")
            except ValueError:
                await ctx.error("Formato de data inválido recebido.")
                return f"Erro: A data '{birth_date}' é inválida. Use DD-MM-AAAA."

        novo_paciente = Patient(
            full_name=full_name,
            main_complaint=main_complaint,
            hourly_rate=hourly_rate,
            birth_date=dt_nascimento,
            contact_info=contact_info,
            current_debt=0.0,
            recurrence_week_day=recurrence_week_day,
            recurrence_time=recurrence_time
        )
        
        session.add(novo_paciente)
        await ctx.info("💾 Salvando no banco de dados...")
        session.commit()
        session.refresh(novo_paciente)
        
        msg_agendamento = ""
        if recurrence_week_day is not None:
            msg_agendamento = f" (Agendado para dia {recurrence_week_day} às {recurrence_time})"

        await ctx.info(f"✨ Paciente {novo_paciente.id} criado com sucesso!")
        return f"Sucesso: Paciente '{full_name}' criado com ID {novo_paciente.id}{msg_agendamento}."
    except Exception as e:
        session.rollback()
        return f"Erro ao criar paciente: {str(e)}"
    finally:
        session.close()

@mcp.tool()
async def listar_historico_sessoes(patient_id: int, ctx: Context, limit: int = 5, ) -> str:
    """
    Busca os últimos registros de sessões de um paciente.
    """
    print(f"📖 [TOOL] Lendo histórico do paciente ID: {patient_id}")
    await ctx.info(f"📚 Buscando as últimas {limit} sessões do paciente {patient_id}...")
    session = session_local()
    try:
        logs = session.query(SessionLog)\
            .filter(SessionLog.patient_id == patient_id)\
            .order_by(desc(SessionLog.session_date))\
            .limit(limit)\
            .all()
        
        if not logs:
            return "Nenhum histórico de sessões encontrado."
            
        history = []
        for log in reversed(logs): 
            history.append({
                "id_sessao": log.id, 
                "data": serialize_date(log.session_date),
                "notas": log.content_private,
                "insights": log.insights_ai,
                "pago": log.is_paid
            })
            
        return json.dumps(history, ensure_ascii=False, indent=2)
    
    except Exception as e:
        return f"Erro ao buscar histórico: {str(e)}"
    finally:
        session.close()

@mcp.tool()
async def registrar_sessao(
    patient_id: int, 
    content_private: str, 
    is_paid: bool, 
    ctx: Context, # Injeção do Contexto
    data_hora_customizada: str = None
) -> str:
    """
    Salva o log de uma sessão e atualiza o financeiro.
    """
    await ctx.info(f"💾 Iniciando registro de sessão para Paciente ID: {patient_id}")
    
    session = session_local()
    try:
        patient = session.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return "Erro: Paciente não encontrado."

        data_sessao = datetime.now()
        
        if data_hora_customizada:
            # FLEXIBILIDADE DE DATA: Troca barras por traços para ajudar a IA
            clean_date = data_hora_customizada.replace("/", "-")
            try:
                # Tenta o padrão brasileiro primeiro (DD-MM-YYYY HH:MM)
                data_sessao = datetime.strptime(clean_date, "%d-%m-%Y %H:%M")
            except ValueError:
                try:
                    # Fallback para padrão de banco/ISO (YYYY-MM-DD HH:MM)
                    data_sessao = datetime.strptime(clean_date, "%Y-%m-%d %H:%M")
                except ValueError:
                    return f"Erro de formato. O sistema recebeu '{data_hora_customizada}'. Por favor, passe a data exatamente como: DD-MM-YYYY HH:MM"
            
            await ctx.info(f"📅 Usando data retroativa: {data_sessao.strftime('%d/%m/%Y %H:%M')}")

        novo_log = SessionLog(
            patient_id=patient_id,
            content_private=content_private,
            is_paid=is_paid,
            session_date=data_sessao
        )
        session.add(novo_log)
        
        status_fin = "Pago"
        if not is_paid:
            await ctx.info(f"💰 Atualizando dívida do paciente (Valor: R$ {patient.hourly_rate})...")
            patient.current_debt += patient.hourly_rate
            status_fin = f"Não pago (Dívida atualizada para R$ {patient.current_debt})"
        
        session.commit()
        await ctx.info("✅ Sessão registrada e financeiro atualizado.")
        return f"Sessão registrada em {serialize_date(data_sessao)}. Status: {status_fin}"

    except Exception as e:
        session.rollback()
        return f"Erro ao registrar sessão: {str(e)}"
    finally:
        session.close()

@mcp.tool()
async def editar_info_de_paciente(patient_id: int, info: str, new_value: Union[str, int, float], ctx: Context) -> str:
    """
    Altera uma informação específica de um paciente.

    Args:
        patient_id: ID do paciente.
        info: ["nome", "principal_queixa", "valor", "contato", "dia_recorrente", "horario_recorrente"]
        new_value: Novo valor. 
                   - Para 'dia_recorrente': 0 (Seg) a 6 (Dom)
                   - Para 'horario_recorrente': HH:MM
    """
    print(f"📝 [TOOL] Editando {info} do paciente ID {patient_id}")
    
    session = session_local()
    try:
        patient = session.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            return json.dumps({"status": "error", "message": "Paciente não encontrado."})
        
        old_val = "anterior"
        await ctx.info(f"✏️ Editando campo '{info}' do paciente {patient_id}...")
        if info == "nome":
            patient.full_name = str(new_value)
        elif info == "principal_queixa":
            patient.main_complaint = str(new_value)
        elif info == "valor":
            patient.hourly_rate = float(new_value)
        elif info == "contato":
            patient.contact_info = str(new_value)
        # --- NOVOS CAMPOS DE EDIÇÃO ---
        elif info == "dia_recorrente":
            try:
                dia = int(new_value)
                if 0 <= dia <= 6:
                    patient.recurrence_week_day = dia
                else:
                    return "Erro: Dia deve ser entre 0 (Seg) e 6 (Dom)."
            except ValueError:
                return "Erro: Dia deve ser um número inteiro."
        
        elif info == "horario_recorrente":
            val = str(new_value)
            if len(val) == 5 and ":" in val:
                patient.recurrence_time = val
            else:
                return "Erro: Horário deve ser HH:MM."
        # -----------------------------
        
        else:
            return f"Campo '{info}' inválido."
        
        session.commit()
        return f"Sucesso: {info} atualizado."

    except Exception as e:
        session.rollback()
        return f"Erro ao editar: {str(e)}"
    finally:
        session.close()


@mcp.tool()
async def listar_pacientes(ctx: Context, limit: int = 10) -> str:
    """
    Lista os pacientes registrados no banco de dados.
    Retorna ID, Nome, Queixa, Dívida e Agendamento.
    """
    await ctx.info(f"📚 Buscando lista de pacientes (limit={limit})...")
    
    session = session_local()
    try:
        # Busca na tabela Patient
        pacientes = session.query(Patient).limit(limit).all()
        
        if not pacientes:
            return "Nenhum paciente cadastrado no sistema."
            
        lista_formatada = []
        dias_map = {0: "Segunda", 1: "Terça", 2: "Quarta", 3: "Quinta", 4: "Sexta", 5: "Sábado", 6: "Domingo"}

        for p in pacientes: 
            agendamento = "Sem horário fixo"
            if p.recurrence_week_day is not None and p.recurrence_time:
                dia_nome = dias_map.get(p.recurrence_week_day, "Dia desconhecido")
                agendamento = f"{dia_nome} às {p.recurrence_time}"

            lista_formatada.append({
                "id": p.id, 
                "nome": p.full_name,
                "queixa": p.main_complaint,
                "contato": p.contact_info,
                "divida_atual": p.current_debt,
                "valor_sessao": p.hourly_rate,
                "agendamento": agendamento
            })
            
        return json.dumps(lista_formatada, ensure_ascii=False, indent=2)
    
    except Exception as e:
        await ctx.error(f"Erro crítico ao listar pacientes: {str(e)}")
        return f"Erro ao buscar lista de pacientes: {str(e)}"
    finally:
        session.close()

if __name__ == "__main__":
    mcp.run(transport="sse")
