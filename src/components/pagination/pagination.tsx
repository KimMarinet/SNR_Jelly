"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PaginationState } from "@/lib/pagination";

type PaginationMode = "link" | "button";

type PaginationLabels = Partial<{
  previousWindow: ReactNode;
  previous: ReactNode;
  next: ReactNode;
  nextWindow: ReactNode;
}>;

type PaginationAriaLabels = Partial<{
  previousWindow: string;
  previous: string;
  next: string;
  nextWindow: string;
  page: (page: number) => string;
}>;

type PaginationBaseProps = {
  pagination: PaginationState;
  className?: string;
  pageClassName?: string;
  activePageClassName?: string;
  inactivePageClassName?: string;
  navClassName?: string;
  navDisabledClassName?: string;
  labels?: PaginationLabels;
  ariaLabels?: PaginationAriaLabels;
  showWindowControls?: boolean;
};

type PaginationLinkProps = PaginationBaseProps & {
  mode: "link";
  pageHrefs: string[];
  previousWindowHref?: string;
  previousHref?: string;
  nextHref?: string;
  nextWindowHref?: string;
  onPageChange?: never;
};

type PaginationButtonProps = PaginationBaseProps & {
  mode: "button";
  onPageChange: (page: number) => void;
  pageHrefs?: never;
  previousWindowHref?: never;
  previousHref?: never;
  nextHref?: never;
  nextWindowHref?: never;
};

export type PaginationControlsProps = PaginationLinkProps | PaginationButtonProps;

const defaultLabels = {
  previousWindow: "<<",
  previous: "<",
  next: ">",
  nextWindow: ">>",
};

const defaultAriaLabels = {
  previousWindow: "10페이지 이전",
  previous: "이전 페이지",
  next: "다음 페이지",
  nextWindow: "10페이지 다음",
  page: (page: number) => `페이지 ${page}`,
};

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function PaginationPageControl({
  mode,
  href,
  pageNumber,
  currentPage,
  className,
  activePageClassName,
  inactivePageClassName,
  ariaLabel,
  onPageChange,
}: {
  mode: PaginationMode;
  href?: string;
  pageNumber: number;
  currentPage: number;
  className?: string;
  activePageClassName?: string;
  inactivePageClassName?: string;
  ariaLabel: string;
  onPageChange?: (page: number) => void;
}) {
  const isActive = pageNumber === currentPage;
  const combinedClassName = joinClasses(
    className,
    isActive ? activePageClassName : inactivePageClassName,
  );

  if (mode === "link") {
    return (
      <Link
        href={href ?? "#"}
        className={combinedClassName}
        aria-label={ariaLabel}
        aria-current={isActive ? "page" : undefined}
      >
        {pageNumber}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPageChange?.(pageNumber)}
      className={combinedClassName}
      aria-label={ariaLabel}
      aria-current={isActive ? "page" : undefined}
    >
      {pageNumber}
    </button>
  );
}

function PaginationNavigationControl({
  mode,
  label,
  ariaLabel,
  disabled,
  className,
  disabledClassName,
  href,
  onPageChange,
  page,
}: {
  mode: PaginationMode;
  label: ReactNode;
  ariaLabel: string;
  disabled: boolean;
  className?: string;
  disabledClassName?: string;
  href?: string;
  onPageChange?: (page: number) => void;
  page: number;
}) {
  const combinedClassName = disabled
    ? joinClasses(className, disabledClassName)
    : joinClasses(className);

  if (mode === "link") {
    if (disabled) {
      return (
        <span className={combinedClassName} aria-label={ariaLabel} aria-hidden="true">
          {label}
        </span>
      );
    }

    return (
      <Link href={href ?? "#"} className={combinedClassName} aria-label={ariaLabel}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPageChange?.(page)}
      disabled={disabled}
      className={combinedClassName}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}

export function PaginationControls(props: PaginationControlsProps) {
  const {
    pagination,
    className,
    pageClassName,
    activePageClassName,
    inactivePageClassName,
    navClassName,
    navDisabledClassName,
    labels,
    ariaLabels,
    showWindowControls = true,
  } = props;

  const mode = props.mode;
  const onPageChange = mode === "button" ? props.onPageChange : undefined;
  const controlLabels = { ...defaultLabels, ...labels };
  const controlAriaLabels = { ...defaultAriaLabels, ...ariaLabels };
  const pageHrefs = mode === "link" ? props.pageHrefs : [];
  const previousWindowHref = mode === "link" ? props.previousWindowHref : undefined;
  const previousHref = mode === "link" ? props.previousHref : undefined;
  const nextHref = mode === "link" ? props.nextHref : undefined;
  const nextWindowHref = mode === "link" ? props.nextWindowHref : undefined;

  return (
    <nav className={className} aria-label="페이지 이동">
      {showWindowControls ? (
        <PaginationNavigationControl
          mode={mode}
          page={pagination.previousWindowPage}
          disabled={!pagination.canGoPrevWindow}
          label={controlLabels.previousWindow}
          ariaLabel={controlAriaLabels.previousWindow}
          className={navClassName}
          disabledClassName={navDisabledClassName}
          href={previousWindowHref}
          onPageChange={onPageChange}
        />
      ) : null}

      <PaginationNavigationControl
        mode={mode}
        page={pagination.previousPage}
        disabled={!pagination.canGoPrev}
        label={controlLabels.previous}
        ariaLabel={controlAriaLabels.previous}
        className={navClassName}
        disabledClassName={navDisabledClassName}
        href={previousHref}
        onPageChange={onPageChange}
      />

      {pagination.pageNumbers.map((pageNumber, index) => (
        <PaginationPageControl
          key={pageNumber}
          mode={mode}
          href={pageHrefs[index]}
          pageNumber={pageNumber}
          currentPage={pagination.currentPage}
          className={pageClassName}
          activePageClassName={activePageClassName}
          inactivePageClassName={inactivePageClassName}
          ariaLabel={controlAriaLabels.page(pageNumber)}
          onPageChange={onPageChange}
        />
      ))}

      <PaginationNavigationControl
        mode={mode}
        page={pagination.nextPage}
        disabled={!pagination.canGoNext}
        label={controlLabels.next}
        ariaLabel={controlAriaLabels.next}
        className={navClassName}
        disabledClassName={navDisabledClassName}
        href={nextHref}
        onPageChange={onPageChange}
      />

      {showWindowControls ? (
        <PaginationNavigationControl
          mode={mode}
          page={pagination.nextWindowPage}
          disabled={!pagination.canGoNextWindow}
          label={controlLabels.nextWindow}
          ariaLabel={controlAriaLabels.nextWindow}
          className={navClassName}
          disabledClassName={navDisabledClassName}
          href={nextWindowHref}
          onPageChange={onPageChange}
        />
      ) : null}
    </nav>
  );
}
