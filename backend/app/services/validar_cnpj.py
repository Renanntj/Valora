import re

def validar_cnpj(cnpj):
    cnpj = str(cnpj)
    cnpj = re.sub(r'\D', '', cnpj)

    
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False

    def calcular_digito(fatia, pesos):
        soma = sum(int(num) * peso for num, peso in zip(fatia, pesos))
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)
    
    
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  
    digito1 = calcular_digito(cnpj[:12], pesos1)
    
    digito2 = calcular_digito(cnpj[:12] + digito1, pesos2)

    
    return cnpj[-2:] == digito1 + digito2
