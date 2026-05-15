"use client";

import { Button } from "@/components/ui/button";
import type { TaskCheckResult, TaskTransition } from "@/lib/system/types";

type TaskCheckResultProps = {
  result: TaskCheckResult;
  transition: TaskTransition | null;
  pending: boolean;
  onContinue: () => void;
  onBackToLab: () => void;
  onRetry: () => void;
};

function getTitle(result: TaskCheckResult, transition: TaskTransition | null) {
  if (result.kind === "passed") {
    return transition?.toLevel
      ? `Проверка пройдена, можно переходить к ${transition.toLevel.title}`
      : `Проверка пройдена, задача решена целиком`
  }

  if (result.kind === "failed_and_reset") {
    return "Проверка не пройдена, задача сброшена"
  }

  if (result.kind === "technical_error") {
    return "Проверка временно недоступна"
  }

  return "Проверка не пройдена"
}

function getMeta(result: TaskCheckResult) {
  if (result.kind === "technical_error") {
    return `Технический сбой на попытке ${result.attemptNumber} из ${result.maxCheckAttempts}.`
  }

  return `Проверка уровня ${result.levelNumber}, попытка ${result.attemptNumber} из ${result.maxCheckAttempts}.`
}

export function TaskCheckResult({
  result,
  transition,
  pending,
  onContinue,
  onBackToLab,
  onRetry,
}: TaskCheckResultProps) {
  const canContinue = result.kind === "passed"
  const canRetry = result.kind === "technical_error"
  const canReturnToLab = result.kind === "failed" || result.kind === "failed_and_reset"

  return (
    <section className="space-y-4 rounded-md border p-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          {result.levelTitle}
        </p>
        <h1 className="font-semibold">
          {getTitle(result, transition)}
        </h1>
        <p className="text-muted-foreground">
          {getMeta(result)}
        </p>
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {result.message}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canContinue ? (
          <Button disabled={pending} onClick={onContinue}>
            {transition?.toLevel ? "Перейти дальше" : "Открыть итог задачи"}
          </Button>
        ) : null}
        {canReturnToLab ? (
          <Button variant="outline" disabled={pending} onClick={onBackToLab}>
            {result.kind === "failed_and_reset" ? "Открыть задачу заново" : "Вернуться в лабораторию"}
          </Button>
        ) : null}
        {canRetry ? (
          <Button disabled={pending} onClick={onRetry}>
            Повторить проверку
          </Button>
        ) : null}
      </div>
    </section>
  );
}
