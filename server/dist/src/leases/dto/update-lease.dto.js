"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLeaseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_lease_dto_1 = require("./create-lease.dto");
class UpdateLeaseDto extends (0, swagger_1.PartialType)(create_lease_dto_1.CreateLeaseDto) {
}
exports.UpdateLeaseDto = UpdateLeaseDto;
//# sourceMappingURL=update-lease.dto.js.map