/**
 * Sistema de Filas Simples para Processamento em Background
 */
type Task = () => Promise<void>;

class QueueManager {
  private queue: Task[] = [];
  private isProcessing: boolean = false;
  private concurrency: number = 3; // Processa até 3 tarefas simultâneas
  private activeCount: number = 0;

  /**
   * Adiciona uma tarefa à fila
   */
  enqueue(task: Task) {
    this.queue.push(task);
    this.processNext();
  }

  /**
   * Processa a próxima tarefa da fila
   */
  private async processNext() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.activeCount++;
    const task = this.queue.shift();

    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("[QUEUE] Erro ao processar tarefa:", error);
      } finally {
        this.activeCount--;
        this.processNext();
      }
    }
  }

  /**
   * Obtém o tamanho atual da fila
   */
  get size() {
    return this.queue.length;
  }
}

export const backgroundQueue = new QueueManager();

/**
 * Helper para executar algo em background sem bloquear a resposta da API
 */
export function runInBackground(task: Task) {
  backgroundQueue.enqueue(task);
  console.log(`[QUEUE] Tarefa adicionada. Tamanho da fila: ${backgroundQueue.size}`);
}
