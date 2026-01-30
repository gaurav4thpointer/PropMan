export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export declare function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};
