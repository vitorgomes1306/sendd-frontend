export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function lookupCep(cep: string): Promise<CepResult> {
  const clean = (cep || '').replace(/\D/g, '');
  if (clean.length !== 8) {
    throw new Error('CEP inválido. Use 8 dígitos.');
  }

  const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!resp.ok) {
    throw new Error('Falha ao consultar CEP.');
  }
  const data = await resp.json();
  if (data?.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    street: data?.logradouro || '',
    neighborhood: data?.bairro || '',
    city: data?.localidade || '',
    state: data?.uf || '',
  };
}